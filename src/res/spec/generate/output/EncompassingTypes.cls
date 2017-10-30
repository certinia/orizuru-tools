/**
 * Copyright (c) 2017, FinancialForce.com, inc
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 *   are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, 
 *      this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *      this list of conditions and the following disclaimer in the documentation 
 *      and/or other materials provided with the distribution.
 * - Neither the name of the FinancialForce.com, inc nor the names of its contributors 
 *      may be used to endorse or promote products derived from this software without 
 *      specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL 
 *  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

public abstract class OrizuruTransport implements ISerializable
{

	protected OrizuruTransport() {
		// abstract class
	}

	public String serialize() {
		return Json.serialize(this);
	}

	public class com_financialforce_Test extends OrizuruTransport // Transport extension for use when sending data to Orizuru Heroku apis
	{

		public DeliveryTypeEnum deliveryType { get; set; }
		public DeliveryTypeCls deliveryTypeCls { get; set; }
		public List<DeliveryTypeEnum> arrayEnum { get; set; }
		public List<DeliveryTypeCls> arrayCls { get; set; }
		public Map<String, DeliveryTypeEnum> mapEnum { get; set; }
		public Map<String, DeliveryTypeCls> mapCls { get; set; }
		public Object testFieldNull { get; set; }
		public Boolean testFieldBoolean { get; set; }
		public Integer testFieldInt { get; set; }
		public Long testFieldLong { get; set; }
		public Double testFieldFloat { get; set; }
		public Double testFieldDouble { get; set; }

		public com_financialforce_Test(DeliveryTypeEnum deliveryType, DeliveryTypeCls deliveryTypeCls, List<DeliveryTypeEnum> arrayEnum, List<DeliveryTypeCls> arrayCls, Map<String, DeliveryTypeEnum> mapEnum, Map<String, DeliveryTypeCls> mapCls, Object testFieldNull, Boolean testFieldBoolean, Integer testFieldInt, Long testFieldLong, Double testFieldFloat, Double testFieldDouble) {
			
			this.deliveryType = deliveryType;
			this.deliveryTypeCls = deliveryTypeCls;
			this.arrayEnum = arrayEnum;
			this.arrayCls = arrayCls;
			this.mapEnum = mapEnum;
			this.mapCls = mapCls;
			this.testFieldNull = testFieldNull;
			this.testFieldBoolean = testFieldBoolean;
			this.testFieldInt = testFieldInt;
			this.testFieldLong = testFieldLong;
			this.testFieldFloat = testFieldFloat;
			this.testFieldDouble = testFieldDouble;

		}

	}

	public enum DeliveryTypeEnum // Internal enum defining a type within an Orizuru Avro transport schema, used within transport extensions
	{

		A,
		B,
		C

	}

	public class DeliveryTypeCls extends OrizuruTransport // Transport extension for use when sending data to Orizuru Heroku apis
	{

		public String testFieldString { get; set; }

		public DeliveryTypeCls(String testFieldString) {
			
			this.testFieldString = testFieldString;

		}

	}

}