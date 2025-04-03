from aws_cdk import aws_certificatemanager as acm, aws_route53 as route53
from constructs import Construct


class Certificate(Construct):
    def __init__(
        self, scope: Construct, id: str, domain_name: str, hosted_zone_name: str
    ):
        super().__init__(scope, id)
        hosted_zone = route53.HostedZone.from_lookup(
            self, "HostedZone", domain_name=hosted_zone_name
        )
        # Create a new ACM certificate
        self.certificate = acm.Certificate(
            self,
            "Certificate",
            domain_name=domain_name,
            validation=acm.CertificateValidation.from_dns(hosted_zone=hosted_zone),
        )
