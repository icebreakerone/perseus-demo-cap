from typing import TypedDict


class Context(TypedDict):
    environment_name: str
    domain: str
    hosted_zone_name: str
