public class AccountService
{
    public static void postAccountIdsToHeroku(Set<Id> accountIds)
    {
        System.enqueueJob(new PostAccountIdsToHeroku(accountIds));
    }
    
    private class PostAccountIdsToHeroku implements System.Queueable, Database.AllowsCallouts
    {
        private Set<Id> ids;
        private String sessionId;
        
        public PostAccountIdsToHeroku(Set<Id> ids)
        {
            this.ids = ids;
            this.sessionId = UserInfo.getSessionId();
        }
        
        public void execute(System.QueueableContext context) 
        {
			List<String> inputList = new List<String>();
			for (Id accountId : ids)
			{
				inputList.add(accountId);
			}
			HerokuConnector.newInstance().post('callout:Orizuru/api/account', new OrizuruTransport.com_financialforce_Account(inputList), sessionId);
    	}
    }
}