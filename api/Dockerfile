FROM gradle:8.5-jdk21 AS build
WORKDIR /app
COPY ./ ./
RUN rm -rf .gradle build
RUN chmod +x ./gradlew

# Install curl for healthcheck
USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

EXPOSE 8080
ENTRYPOINT ["./gradlew", "bootRun"] 