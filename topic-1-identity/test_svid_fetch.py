from spiffe import WorkloadApiClient

with WorkloadApiClient() as client:
    svid = client.fetch_x509_svid()
    print(f"SPIFFE ID: {svid.spiffe_id}")
    print(f"Cert chain length: {len(svid.cert_chain)}")
    print(f"Available attributes: {[a for a in dir(svid) if not a.startswith('_')]}")
