"""
app/graph_engine.py

Tier-2: Topological Graph Engine.

Models the transaction ecosystem as a bipartite graph G = (C ∪ A, E) where:
    C = customer identity nodes
    A = shared asset nodes (device fingerprints, IPs, payment instruments,
        drop addresses)
    E = edges connecting a customer to every asset they have used

This lets us detect Sybil rings structurally, independent of any single
transaction's own attributes:

- Degree centrality on asset nodes: how many *distinct* customers share
  one physical device / card / IP.
- Connected components: disjoint subgraphs = discrete criminal syndicates
  ("rings"), each assigned a stable ring ID.
- Jaccard co-occurrence similarity between two customer nodes: the
  fraction of their asset neighborhoods that overlap.

The graph is fully in-memory (NetworkX) and updated incrementally on every
ingested transaction, so ring membership and centrality are always
current for the next transaction's risk evaluation — no batch recompute.
"""

from __future__ import annotations

import hashlib
import threading
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

import networkx as nx


ASSET_KIND_DEVICE = "device"
ASSET_KIND_IP = "ip"
ASSET_KIND_INSTRUMENT = "instrument"
ASSET_KIND_DROP_ADDRESS = "drop_address"


def _asset_node_id(kind: str, raw_value: str) -> str:
    """Namespaces asset identifiers so a device_id can never collide with
    an ip_address or payment_instrument_id that happens to share a string."""
    return f"{kind}:{raw_value}"


def _customer_node_id(customer_id: str) -> str:
    return f"customer:{customer_id}"


@dataclass
class RingSummary:
    ring_id: str
    customer_ids: Set[str] = field(default_factory=set)
    asset_ids: Set[str] = field(default_factory=set)
    max_asset_degree: int = 0

    @property
    def size(self) -> int:
        return len(self.customer_ids)


class BipartiteGraphEngine:
    """Thread-safe incremental bipartite graph for Sybil / syndicate detection."""

    def __init__(self) -> None:
        self._graph = nx.Graph()
        self._lock = threading.RLock()
        # Cache of node -> ring_id, rebuilt lazily whenever the graph
        # topology changes (an edge insertion can merge two rings).
        self._ring_cache_dirty = True
        self._ring_cache: Dict[str, str] = {}
        self._ring_summaries: Dict[str, RingSummary] = {}

    # ------------------------------------------------------------------ #
    # Graph mutation
    # ------------------------------------------------------------------ #

    def ingest_transaction(
        self,
        customer_id: str,
        device_id: str,
        ip_address: str,
        payment_instrument_id: str,
        drop_address: Optional[str] = None,
    ) -> None:
        """Adds/updates all edges implied by a single transaction."""
        with self._lock:
            c_node = _customer_node_id(customer_id)
            self._graph.add_node(c_node, kind="customer", customer_id=customer_id)

            assets: List[Tuple[str, str]] = [
                (ASSET_KIND_DEVICE, device_id),
                (ASSET_KIND_IP, ip_address),
                (ASSET_KIND_INSTRUMENT, payment_instrument_id),
            ]
            if drop_address:
                assets.append((ASSET_KIND_DROP_ADDRESS, drop_address))

            for kind, raw_value in assets:
                a_node = _asset_node_id(kind, raw_value)
                self._graph.add_node(a_node, kind=kind, value=raw_value)
                if self._graph.has_edge(c_node, a_node):
                    self._graph[c_node][a_node]["weight"] += 1
                else:
                    self._graph.add_edge(c_node, a_node, weight=1)

            self._ring_cache_dirty = True

    # ------------------------------------------------------------------ #
    # Centrality & structural signals
    # ------------------------------------------------------------------ #

    def asset_degree_centrality(self, kind: str, raw_value: str) -> int:
        """Number of *distinct customers* connected to this asset —
        i.e. how many identities share one device / IP / card."""
        a_node = _asset_node_id(kind, raw_value)
        with self._lock:
            if a_node not in self._graph:
                return 0
            return self._graph.degree(a_node)

    def customer_asset_neighbors(self, customer_id: str) -> Set[str]:
        c_node = _customer_node_id(customer_id)
        with self._lock:
            if c_node not in self._graph:
                return set()
            return set(self._graph.neighbors(c_node))

    def jaccard_similarity(self, customer_id_a: str, customer_id_b: str) -> float:
        """Jaccard co-occurrence similarity between two customers' asset
        neighborhoods: |N(a) ∩ N(b)| / |N(a) ∪ N(b)|."""
        neighbors_a = self.customer_asset_neighbors(customer_id_a)
        neighbors_b = self.customer_asset_neighbors(customer_id_b)
        if not neighbors_a and not neighbors_b:
            return 0.0
        union = neighbors_a | neighbors_b
        if not union:
            return 0.0
        intersection = neighbors_a & neighbors_b
        return len(intersection) / len(union)

    def most_similar_customers(self, customer_id: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Finds other customers with the highest Jaccard overlap by
        traversing 2-hop neighbors (customers who share at least one asset),
        which is far cheaper than an all-pairs comparison."""
        c_node = _customer_node_id(customer_id)
        with self._lock:
            if c_node not in self._graph:
                return []
            candidate_customers: Set[str] = set()
            for asset_node in self._graph.neighbors(c_node):
                for other_c_node in self._graph.neighbors(asset_node):
                    if other_c_node != c_node:
                        candidate_customers.add(other_c_node)

        scored = []
        for other_c_node in candidate_customers:
            other_customer_id = other_c_node.split(":", 1)[1]
            score = self.jaccard_similarity(customer_id, other_customer_id)
            scored.append((other_customer_id, score))
        scored.sort(key=lambda pair: pair[1], reverse=True)
        return scored[:top_k]

    # ------------------------------------------------------------------ #
    # Ring / connected-component detection
    # ------------------------------------------------------------------ #

    def _rebuild_ring_cache(self) -> None:
        """Recomputes connected components and assigns each a stable,
        deterministic ring ID derived from a hash of its sorted member
        nodes — so the same syndicate always maps to the same ring ID
        across process restarts, as long as membership is unchanged."""
        ring_cache: Dict[str, str] = {}
        ring_summaries: Dict[str, RingSummary] = {}

        for component in nx.connected_components(self._graph):
            customer_nodes = {n for n in component if n.startswith("customer:")}
            asset_nodes = {n for n in component if not n.startswith("customer:")}

            # Only components with 2+ customers represent a *shared* asset
            # cluster worth flagging as a syndicate; singleton customers
            # (their own unique device/IP/card) are not a ring.
            if len(customer_nodes) < 2:
                continue

            digest = hashlib.sha256("|".join(sorted(component)).encode("utf-8")).hexdigest()
            ring_id = f"RING-{digest[:6].upper()}"

            max_degree = max((self._graph.degree(a) for a in asset_nodes), default=0)

            summary = RingSummary(
                ring_id=ring_id,
                customer_ids={n.split(":", 1)[1] for n in customer_nodes},
                asset_ids=asset_nodes,
                max_asset_degree=max_degree,
            )
            ring_summaries[ring_id] = summary
            for node in component:
                ring_cache[node] = ring_id

        self._ring_cache = ring_cache
        self._ring_summaries = ring_summaries
        self._ring_cache_dirty = False

    def ring_id_for_customer(self, customer_id: str) -> Optional[str]:
        c_node = _customer_node_id(customer_id)
        with self._lock:
            if self._ring_cache_dirty:
                self._rebuild_ring_cache()
            return self._ring_cache.get(c_node)

    def ring_summary(self, ring_id: str) -> Optional[RingSummary]:
        with self._lock:
            if self._ring_cache_dirty:
                self._rebuild_ring_cache()
            return self._ring_summaries.get(ring_id)

    def all_rings(self) -> List[RingSummary]:
        with self._lock:
            if self._ring_cache_dirty:
                self._rebuild_ring_cache()
            return list(self._ring_summaries.values())

    # ------------------------------------------------------------------ #
    # Composite structural risk score (feeds the 35% graph weight)
    # ------------------------------------------------------------------ #

    def structural_risk_score(
        self,
        customer_id: str,
        device_id: str,
        ip_address: str,
        payment_instrument_id: str,
    ) -> Tuple[float, Dict[str, float], Optional[str]]:
        """
        Computes a [0, 1] structural collusion score for the CURRENT
        transaction's assets, plus a breakdown of contributing signals and
        the ring ID this customer now belongs to (if any).

        Heuristic: each asset's degree centrality is squashed with a
        saturating function so that going from 1->2 shared identities is a
        meaningful jump, while very large rings don't blow past 1.0.
        """
        def saturating(degree: int, midpoint: float = 4.0) -> float:
            if degree <= 1:
                return 0.0
            # Logistic-like saturation: degree=2 -> ~0.2, degree=8 -> ~0.8
            return 1.0 - (1.0 / (1.0 + (degree - 1) / midpoint))

        device_degree = self.asset_degree_centrality(ASSET_KIND_DEVICE, device_id)
        ip_degree = self.asset_degree_centrality(ASSET_KIND_IP, ip_address)
        instrument_degree = self.asset_degree_centrality(ASSET_KIND_INSTRUMENT, payment_instrument_id)

        device_score = saturating(device_degree, midpoint=3.0)   # device sharing is the strongest tell
        ip_score = saturating(ip_degree, midpoint=6.0)            # IP sharing is weaker (NAT/offices)
        instrument_score = saturating(instrument_degree, midpoint=2.0)  # card recycling is very strong

        component_scores = {
            "device_sharing": round(device_score, 4),
            "ip_sharing": round(ip_score, 4),
            "instrument_sharing": round(instrument_score, 4),
        }

        # Weighted blend within the graph engine itself (device + instrument
        # sharing are the dominant Sybil tells; IP is corroborating).
        composite = (0.45 * device_score) + (0.20 * ip_score) + (0.35 * instrument_score)
        composite = max(0.0, min(1.0, composite))

        ring_id = self.ring_id_for_customer(customer_id)
        return composite, component_scores, ring_id

    # ------------------------------------------------------------------ #
    # Introspection
    # ------------------------------------------------------------------ #

    def node_count(self) -> int:
        with self._lock:
            return self._graph.number_of_nodes()

    def edge_count(self) -> int:
        with self._lock:
            return self._graph.number_of_edges()


# Module-level singleton shared across the FastAPI app lifespan.
graph_engine = BipartiteGraphEngine()
