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