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

public class AccountService implements API
{
    public interface API 
    {
        void postAccountIdsToHeroku(Set<Id> accountIds);
        void postAccountIdsToHerokuAsync(Set<Id> accountIds);
    }
    
    private static API instance = new AccountService(); 
    
	public static API newInstance()
    {
        return instance;
    }
    
    @TestVisible
    private static void setMock(API mock)
    {
        instance = mock;
    }
    
    private AccountService() {}
    
    public void postAccountIdsToHeroku(Set<Id> accountIds)
    {
        postAccountIdsToHeroku(accountIds, UserInfo.getSessionId());
    }
    
    public void postAccountIdsToHerokuAsync(Set<Id> accountIds)
    {
        System.enqueueJob(new PostAccountIdsToHerokuAsync(accountIds));
    }
    
    private class PostAccountIdsToHerokuAsync implements System.Queueable, Database.AllowsCallouts
    {
        private Set<Id> ids;
        private String sessionId;
        
        public PostAccountIdsToHerokuAsync(Set<Id> ids)
        {
            this.ids = ids;
            this.sessionId = UserInfo.getSessionId();
        }
        
        public void execute(System.QueueableContext context) 
        {
			new AccountService().postAccountIdsToHeroku(this.ids, this.sessionId);
    	}
    }
    
    private void postAccountIdsToHeroku(Set<Id> accountIds, String sessionId)
    {
		List<String> inputList = new List<String>();
		if (accountIds == null || accountIds.size() == 0) {
			return;
		}
		for (Id accountId : accountIds)
		{
			inputList.add(accountId);
		}
        getConnector().post('callout:Orizuru/api/account', new OrizuruTransport.com_financialforce_Account(inputList), sessionId);
    }
    
    private IHerokuConnector getConnector() 
    {
        return HerokuConnector.newInstance();
    }
    
}