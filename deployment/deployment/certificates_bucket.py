from aws_cdk import (
    aws_s3 as s3,
    Stack,
    Tags,
    RemovalPolicy,
)
from constructs import Construct


class CertificatesBucket(Construct):
    """Creates an S3 bucket for storing certificates and signing bundles."""

    def __init__(self, scope: Construct, id: str, environment_name: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # Create S3 bucket for certificates
        # Note: S3 bucket names must be globally unique. Using account ID and region for uniqueness
        stack = Stack.of(self)
        self.bucket = s3.Bucket(
            self,
            "CertificatesBucket",
            bucket_name=f"provenance-service-certs-{environment_name}-{stack.account}-{stack.region}",  # Globally unique name
            versioned=True,  # Enable versioning for certificate tracking
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            auto_delete_objects=False,  # Don't auto-delete certificates
            removal_policy=RemovalPolicy.RETAIN,  # Retain certificates
        )

        # Add tags
        Tags.of(self.bucket).add("ResourceType", "s3-bucket")
        Tags.of(self.bucket).add("Purpose", "certificate-storage")
        Tags.of(self.bucket).add("Environment", environment_name)
