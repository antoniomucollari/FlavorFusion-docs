# How to cache the trending restaurants

This section shows restaurants most sold for today.
Without caching this could be simply query the db for the restaurant branch with most sold menus for today time period. Although 
easy to implement this will cause a lot of slow down and reduce database throughput because of the constant aggregation
queries, joins, and sorting operations executed on every request.

### My solution
Instead of counting every user request the number of orders we cache in a dedicated column in database.
Every 00:00
``` 
    @Scheduled(cron = "0 0 0 * * *", zone = "Europe/Tirane")
    public void scheduleDailyReset() {
        dailyStatsService.performDailyReset();
    }
```
calls the 
     
the performDailyReset() scheduler executes this query

```sql
UPDATE RestaurantBranch b SET b.dailyOrderCount = 0
```
but wait how the multiple instances know if the dabtabase is already updated and not execute the same query multiple times also how 
to know if the scheduler was turned off at 00:00 oclock due to power outage?
Two options to fix it, add a isolated worked in lambda/azure functions to do scheuling jobs, or add locks in redis. 

--- 
now that we have a column dedicated for the number of sales we need to update it and this is how i do it:

