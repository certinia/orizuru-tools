public class ExampleCallout 
{
    @TestVisible private static final String ACCOUNT_ENDPOINT = '/api/account';
    @TestVisible private static final String POST_METHOD = 'POST';
    @TestVisible private static final String AUTHORIZATION_HEADER = 'Authorization';
    @TestVisible private static final String AUTHORIZATION_PREFIX = 'bearer ';
    
    public static void call(String instanceUrl, Id accountId) 
    {
        HttpRequest req = new HttpRequest();
		req.setEndpoint(instanceUrl + ACCOUNT_ENDPOINT);
    	req.setMethod(POST_METHOD);
        req.Setheader(AUTHORIZATION_HEADER, AUTHORIZATION_PREFIX + UserInfo.getSessionId());
        req.setBody(new PostBody(accountId).serialize());
		send(req);
    }
    
    private static HttpResponse send(HttpRequest req)
    {
        Http h = new Http();
        return h.send(req);
    }
    
    private class PostBody 
    {
        public String accountId { get; set; }
        
        public PostBody(String accountId) 
        {
            this.accountId = accountId;
        }
        
        public String serialize() 
        {
            return JSON.serialize(this);
        }
    }
}