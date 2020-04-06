# prince-shotoku
Gather all public channel message to one place

## Test in local with ngrok

Use [ngrok](https://ngrok.com/) for local testing.
I tried [localhost.run](https://localhost.run/), but it didn't work as expected.

### Configure ngrok.yml

Configuration file for ngrok will be stored on `${HOME}/.ngrok2` directory with name `ngrok.yml`.
You can install authtoken by running `ngrok authtoken <YOUR_AUTHTOKEN>` which will be stored in this `ngrok.yml`.

Here are my configuration.

```yaml
# https://ngrok.com/docs#getting-started-authtoken
authtoken: <YOUR_AUTHTOKEN>
# https://ngrok.com/docs#config_region
region: jp
tunnels:
  shotoku:
    addr: 3000
    proto: http
```

By setting _tunnels_, you can start ngrok with specified configuration by simply running `ngrok start shotoku`.
