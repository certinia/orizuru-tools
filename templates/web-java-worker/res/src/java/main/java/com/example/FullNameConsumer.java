/**
 * Copyright (c) 2017
 * All rights reserved.
 **/

package com.example;

import com.example.FullName;
import com.rabbitmq.client.Channel;

import com.financialforce.orizuru.exception.consumer.handler.HandleMessageException;
import com.financialforce.orizuru.message.Context;
import com.financialforce.orizuru.transport.rabbitmq.DefaultConsumer;

/**
 * Handles FullName.
 * <p>
 * Extension of {@link DefaultConsumer}.
 */
public class FullNameConsumer extends DefaultConsumer<FullName, FullName> {

	public FullNameConsumer(Channel channel) {
		super(channel, FullName.class.getName(), null);
	}

	@Override
	public FullName handleMessage(Context context, FullName input) throws HandleMessageException {

		System.out.println("Got a message!");

		return null;

	}

}
