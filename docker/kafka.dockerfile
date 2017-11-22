# From https://github.com/spotify/docker-kafka/blob/master/kafka/Dockerfile

# Kafka and Zookeeper

FROM java:openjdk-8-jre

ENV DEBIAN_FRONTEND noninteractive
ENV SCALA_VERSION 2.11
ENV KAFKA_VERSION 0.10.1.0
ENV KAFKA_HOME /opt/kafka_"$SCALA_VERSION"-"$KAFKA_VERSION"

# Install Kafka, Zookeeper and other needed things
RUN apt-get update 
RUN apt-get install -y zookeeper wget supervisor dnsutils 
RUN rm -rf /var/lib/apt/lists/* 
RUN apt-get clean
RUN wget -q https://archive.apache.org/dist/kafka/"$KAFKA_VERSION"/kafka_"$SCALA_VERSION"-"$KAFKA_VERSION".tgz -O /tmp/kafka_"$SCALA_VERSION"-"$KAFKA_VERSION".tgz 
RUN tar xfz /tmp/kafka_"$SCALA_VERSION"-"$KAFKA_VERSION".tgz -C /opt 
RUN rm /tmp/kafka_"$SCALA_VERSION"-"$KAFKA_VERSION".tgz

# Supervisor config
ADD supervisor/kafka.conf supervisor/zookeeper.conf /etc/supervisor/conf.d/

# Add the required scripts
ADD scripts/start-kafka.sh /usr/bin/start-kafka.sh
ADD scripts/create-topic.sh /usr/bin/create-topic.sh

# 2181 is zookeeper, 9092 is kafka
EXPOSE 2181 9092
