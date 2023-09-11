# static-cs2-portraits
Disable animated Steam profile pictures in Counter-Strike 2

## How does it work

This application works by intercepting traffic to one of Valve's CDNs. When a request for an
animated user portrait is made, static-cs2-portraits crushes the file into a static image.

## Security implications

This project intentionally bypasses the very security that TLS provides. Certificates are used to
verify that web traffic goes to the right place. We don't want CS2 to get avatars from the right
place, we want to get them from the static-cs2-portraits server. It's easy enough to route traffic
arbitrarily using the hosts file, but without a valid cert for the domain the connection will
correctly be reported as insecure.

If you install static-cs2-portrait's certificate authority, applications will act no differently
than if you were to connect to Valve's server directly. This is necessary for tricking CS2 into
using static-cs2-portraits.

And since static-cs2-portraits **doesn't** have a common certificate shared amongst all users, you
can be reasonably sure that the likelyhood an attacker will use the newly installed certificate
authority to execute a [MITM attack](https://wikipedia.org/wiki/Man-in-the-middle_attack) is
minimal. But be sure to keep your unique `static-cs2-key.pem` file private.

If you're still concerned about security, I would not recommend using this project. Due to the
nature of this project, secuity concerns are completely valid. Disabling animated avatars in CS2
isn't worth the risk of setting up static-cs2-portraits without taking proper precautions.

## VAC

No game files are being modified. However, I cannot guarantee that intercepting this traffic will
never result in a VAC ban. Use at your own risk.

## How to use

static-cs2-portraits doesn't currently support Windows as a host. Use Docker or WSL if necessary.
This project requires node and openssl.

The application itself needs to be able to communicate with the CDN it's intercepting traffic from.
The easiest way to accomplish this is to run static-cs2-portraits on a separate computer.

For Docker, use [docker-compose.yml](docker-compose.yml) as a guide. Otherwise run `npm install`
and `sudo PORT=443 node index.js`.

Back to your gaming rig. In order to route traffic to the server, either update your hosts file
(`C:\Windows\System32\drivers\etc\hosts`) or add a rule to your DNS server if you have one (such
as pihole).

Then you need to install the TLS cert it generated. You can find `static-cs2-cert.crt` in the 
`keys` folder of your working directory or by navigating to `http://ip.of.server:8080/cert.crt`.
Now that you've obtained the crt file, open it. Click "install certificate." Click "Next." Select
"Place all certificates in the following store" and use the browse button to select "Trusted Root
Certification Authorities." Then click "Next" and then "Finish." You will be presented a security
warning. See the security section of this readme. Clicking "yes" will install the certificate
authority.

Start up CS2 and enjoy a distraction-free gameplay experience.