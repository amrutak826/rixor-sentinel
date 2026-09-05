"""
tests/test_graph_engine.py

Verifies the bipartite graph engine correctly detects shared-asset rings,
computes degree centrality, and computes Jaccard similarity.
"""

from app.graph_engine import BipartiteGraphEngine


def test_single_customer_no_ring():
    engine = BipartiteGraphEngine()
    engine.ingest_transaction("C1", "Device-1", "1.1.1.1", "Instrument-1")
    assert engine.ring_id_for_customer("C1") is None


def test_shared_device_creates_ring():
    engine = BipartiteGraphEngine()
    engine.ingest_transaction("C1", "Device-17", "1.1.1.1", "Instrument-1")
    engine.ingest_transaction("C2", "Device-17", "2.2.2.2", "Instrument-2")
    engine.ingest_transaction("C3", "Device-17", "3.3.3.3", "Instrument-3")

    ring_c1 = engine.ring_id_for_customer("C1")
    ring_c2 = engine.ring_id_for_customer("C2")
    ring_c3 = engine.ring_id_for_customer("C3")

    assert ring_c1 is not None
    assert ring_c1 == ring_c2 == ring_c3

    summary = engine.ring_summary(ring_c1)
    assert summary.size == 3
    assert engine.asset_degree_centrality("device", "Device-17") == 3


def test_disjoint_customers_different_rings():
    engine = BipartiteGraphEngine()
    engine.ingest_transaction("C1", "Device-A", "1.1.1.1", "Instrument-A")
    engine.ingest_transaction("C2", "Device-A", "2.2.2.2", "Instrument-B")

    engine.ingest_transaction("C3", "Device-B", "9.9.9.9", "Instrument-C")
    engine.ingest_transaction("C4", "Device-B", "8.8.8.8", "Instrument-D")

    ring_1 = engine.ring_id_for_customer("C1")
    ring_2 = engine.ring_id_for_customer("C3")
    assert ring_1 != ring_2


def test_jaccard_similarity_identical_assets():
    engine = BipartiteGraphEngine()
    engine.ingest_transaction("C1", "Device-X", "1.1.1.1", "Instrument-X")
    engine.ingest_transaction("C2", "Device-X", "1.1.1.1", "Instrument-X")
    similarity = engine.jaccard_similarity("C1", "C2")
    assert similarity == 1.0


def test_jaccard_similarity_no_overlap():
    engine = BipartiteGraphEngine()
    engine.ingest_transaction("C1", "Device-X", "1.1.1.1", "Instrument-X")
    engine.ingest_transaction("C2", "Device-Y", "2.2.2.2", "Instrument-Y")
    similarity = engine.jaccard_similarity("C1", "C2")
    assert similarity == 0.0


def test_structural_risk_score_increases_with_sharing():
    engine = BipartiteGraphEngine()

    # First two customers register the shared device — degree becomes 2.
    engine.ingest_transaction("C1", "Device-1", "1.1.1.1", "Instrument-1")
    engine.ingest_transaction("C2", "Device-1", "2.2.2.2", "Instrument-2")

    # A brand-new customer on their own unique device: no sharing yet.
    score_solo, _, _ = engine.structural_risk_score("C-SOLO", "Device-SOLO", "3.3.3.3", "Instrument-SOLO")

    # A third customer arriving on the already-shared device: sharing detected.
    score_shared, _, ring_id = engine.structural_risk_score("C3", "Device-1", "4.4.4.4", "Instrument-3")

    assert score_shared > score_solo
    assert score_solo == 0.0
