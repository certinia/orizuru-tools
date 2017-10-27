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

	public class com_financialforce_TestOne extends OrizuruTransport // Transport extension for use when sending data to Orizuru Heroku apis
	{

		public com_financialforce_inner_Subtype test { get; set; }

		public com_financialforce_TestOne(com_financialforce_inner_Subtype test) {
			
			this.test = test;

		}

	}

	public class com_financialforce_inner_Subtype // Internal class defining a type within an Orizuru Avro transport schema, used within transport extensions
	{

		public String testString { get; set; }

		public com_financialforce_inner_Subtype(String testString) {
			
			this.testString = testString;

		}

	}

	public class com_financialforce_TestTwo extends OrizuruTransport // Transport extension for use when sending data to Orizuru Heroku apis
	{

		public com_financialforce_inner_Subtype test { get; set; }
		public String somethingElse { get; set; }

		public com_financialforce_TestTwo(com_financialforce_inner_Subtype test, String somethingElse) {
			
			this.test = test;
			this.somethingElse = somethingElse;

		}

	}

}