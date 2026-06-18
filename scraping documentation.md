# How I scraped xx restaurant branches from wolt

## Cover and profile images
since cover and profile images are not found in the json file I have to do it manually.Firstly, I have to put the images in the json/restaurants/img/ saving in this format: than add this to `application.properties` and lastly restart the app.

```lartedellapizza_cover.avif```
restaurantName_cover.fileFormats
s3 image would be identical in size and format.
The output would be this:
``` 
https://d3u269mlo8clta.cloudfront.net/restaurantName/profile
https://d3u269mlo8clta.cloudfront.net/restaurantName/cover
```