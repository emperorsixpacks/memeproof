from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    walrus_publisher_url: str = "https://publisher.testnet.walrus.space"
    walrus_aggregator_url: str = "https://aggregator.testnet.walrus.space"
    walrus_epochs: int = 1

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
