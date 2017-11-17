trigger Account on Account (after insert) 
{
	AccountService.newInstance().postAccountIdsToHerokuAsync(trigger.newMap.keySet());
}