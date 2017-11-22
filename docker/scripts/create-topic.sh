#!/bin/sh

echo 'Creating Topic ' $1
sh $KAFKA_HOME/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 4 --topic $1
echo $1 $? >> createdTopics.txt;
sleep 2s;
