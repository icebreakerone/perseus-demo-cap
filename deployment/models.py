from typing import TypedDict, Optional


class Context(TypedDict):
    environment_name: str
    domain: str
    hosted_zone_name: str
    auth_domain: str
    mtls_domain: str
    provenance_domain: Optional[str]  # Optional domain for provenance service
