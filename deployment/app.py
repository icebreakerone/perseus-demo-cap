import os
import uuid

from aws_cdk import App, Stack, Tags
import aws_cdk as cdk


from deployment.networking import NetworkConstruct
from deployment.policies import SecretsManagerPolicy


from deployment.nextjs_service import NextJsService
from deployment.certificate import Certificate
from deployment.ecs_cluster import SharedEcsCluster
from deployment.kms_key import ProvenanceKmsKey
from deployment.certificates_bucket import CertificatesBucket
from deployment.provenance_policies import ProvenanceServicePolicy
from deployment.provenance_service import ProvenanceService
from models import Context

app = App()

deployment_context = app.node.try_get_context("deployment_context") or "dev"


contexts: dict[str, Context] = {
    "dev": {
        "environment_name": "dev",
        "domain": "preprod.perseus-demo-cap.ib1.org",
        "hosted_zone_name": "perseus-demo-cap.ib1.org",
        "auth_domain": "preprod.mtls.perseus-demo-authentication.ib1.org",
    },
    "prod": {
        "environment_name": "prod",
        "domain": "perseus-demo-cap.ib1.org",
        "hosted_zone_name": "perseus-demo-cap.ib1.org",
        "auth_domain": "mtls.perseus-demo-authentication.ib1.org",
    },
}

stack = Stack(
    app,
    f"CapDemoStack-{deployment_context}",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"), region=os.getenv("CDK_DEFAULT_REGION")
    ),
)

Tags.of(stack).add("ib1:p-perseus:owner", "kip.parker@ib1.org")
Tags.of(stack).add("ib1:p-perseus:stage", deployment_context)

network = NetworkConstruct(
    stack, "Network", environment_name=contexts[deployment_context]["environment_name"]
)

# Create shared ECS cluster for all services
shared_cluster = SharedEcsCluster(
    stack,
    "SharedEcsCluster",
    vpc=network.vpc,
    environment_name=contexts[deployment_context]["environment_name"],
)

secrets_policy = SecretsManagerPolicy(
    stack,
    "SSMPermissions",
    app_name="perseus-demo-cap",
    env_name=contexts[deployment_context]["environment_name"],
)

certificate = Certificate(
    stack,
    "Certificate",
    domain_name=contexts[deployment_context]["domain"],
    hosted_zone_name=contexts[deployment_context]["hosted_zone_name"],
)


nextjs_service = NextJsService(
    stack,
    "NextJsService",
    cluster=shared_cluster.cluster,
    vpc=network.vpc,
    secrets_policy=secrets_policy.policy,
    environment={
        "SECRET_COOKIE_PASSWORD": uuid.uuid4().hex,
        "NEXT_PUBLIC_APP_URL": f"https://{contexts[deployment_context]["domain"]}",
        "NEXT_PUBLIC_REDIRECT_URL": f"https://{contexts[deployment_context]["domain"]}?key=edpVerified",
        "NEXT_PUBLIC_CLIENT_ID": "f67916ce-de33-4e2f-a8e3-cbd5f6459c30",
        "NEXT_PUBLIC_SERVER": f"https://{contexts[deployment_context]['auth_domain']}",
        "PROVENANCE_SERVICE_URL": f"http://provenance-service.perseus-cap-{contexts[deployment_context]['environment_name']}.local:8080",
        "APP_ENV": deployment_context,
        "NODE_ENV": "production",
    },
    ecs_sg=network.ecs_sg,
    certificate=certificate.certificate,
    domain_name=contexts[deployment_context]["domain"],
    domain_zone_name=contexts[deployment_context]["hosted_zone_name"],
    env_name=(
        "prod"
        if contexts[deployment_context]["environment_name"] == "prod"
        else "preprod"
    ),
)

# Provenance Service Resources
provenance_kms_key = ProvenanceKmsKey(
    stack,
    "ProvenanceKmsKey",
    environment_name=contexts[deployment_context]["environment_name"],
)

certificates_bucket = CertificatesBucket(
    stack,
    "CertificatesBucket",
    environment_name=contexts[deployment_context]["environment_name"],
)

provenance_service_policy = ProvenanceServicePolicy(
    stack,
    "ProvenanceServicePolicy",
    app_name="perseus-demo-cap",
    env_name=contexts[deployment_context]["environment_name"],
    kms_key_arn=provenance_kms_key.key.key_arn,
    s3_bucket_arn=certificates_bucket.bucket.bucket_arn,
)

# Provenance Service (internal-only, accessible via service discovery)
provenance_service = ProvenanceService(
    stack,
    "ProvenanceService",
    cluster=shared_cluster.cluster,
    vpc=network.vpc,
    kms_key=provenance_kms_key.key,
    certificates_bucket=certificates_bucket.bucket,
    provenance_service_policy=provenance_service_policy.policy,
    ecs_sg=network.ecs_sg,
    environment_name=contexts[deployment_context]["environment_name"],
    service_discovery_namespace=network.service_discovery_namespace,
)

app.synth()
