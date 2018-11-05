trigger Account on Account (after insert) 
{
	AccountService.postAccountIdsToHeroku(trigger.newMap.keySet());
}