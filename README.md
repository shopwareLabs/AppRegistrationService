# App registration service

## Quickstart

### Install & dev

```
npm install
npm run dev
```

### Deploy
```
npm run deploy
```

## Idea

This service is responsible for registering apps, so apps can be stateless and don't need to keep track of the installed shops + secrets etc.

## Workflow

The app makes a request to register itself to use the service. The app provides the `app secret` for this app, this one will also be used for authenticating requests between the app and this service.
The service answers with a newly generated app ID, which can be used in the registration urls that should be configured in the apps manifest.yaml file.

When the app is installed the registration then happens with this service, the app can use this service to get all needed meta data to a shop (e.g. it's url or the api keys for that shop).

## ToDos

- [ ] heavily cache installed app reads from app side (+ invalidate on changes)
  - not sure if it is possible or makes sense, as in order to validate the auth we need to do a DB request anyway
- [x] implement endpoints for shopware lifecycle (update shopware, uninstall app, ...)
- [ ] implement webhooks for apps to register (e.g. onInstall onUpdate etc + handle auth)
- [ ] provide sdk and include in the js sdk