# inalltwelvekeys

## Setup certificates for local network development with https
* make sure the two following lines are in /etc/hosts (on my machine with the webserver)
* also make sure they are in the raspberry pi /etc/hosts (included in the pianopi readme)
* ips may change, make sure they are accurate
```text
192.168.0.3 mbp.local
192.168.0.11 pianopi.local
```
Then create certificate authority and certificate
```shell
mkdir ~/certs/
cd ~/certs

# create self-signed CA (certificate authority)
rm ca.*
openssl genpkey -algorithm RSA -out ca.key
openssl req -x509 -new -key ca.key -out ca.crt # Follow the prompts to provide information for the CA certificate

# create certificate signing request for the local network hostname
cd ~/certs
rm cert.*
cat > cert.cnf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no


[req_distinguished_name]
CN = mbp.local

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = mbp.local
EOF

openssl req -new -nodes -out cert.csr -keyout cert.key -config cert.cnf

# sign the CSR with the CA certificate
openssl x509 -req -in cert.csr -out cert.crt -CA ca.crt -CAkey ca.key -CAcreateserial -days 365

# (optionally) verify the certificate
openssl x509 -in cert.crt -text -noout

```
* add the ca.crt and the cert.crt to keychain
* double-click the ca.cert and trust it always
* make ca.cert trusted on both mbp machine and pianopi raspberrypi
* chrome does not seem to want to cooperate, so just confirm and go into dangerous webpage

## Steps to configure linode server from scratch
* Go to linode.com and create a new linode
  * Shared CPU - Nanode 1 GB
  * Label it something like "inalltwelvekeys-linode"
  * save root password, ip addresses and such in password manager
* Setup DNS from namecheap -> Linode
  * see: https://merelycurious.me/post/connecting-namecheap-domain-to-linode
* Set up SSL certificate on namecheap
  * ssh into linode
```shell
ssh root@<ipv4 address>
# create a certificate signing request (for https/wss ssl cert)
# see: https://www.linode.com/docs/guides/obtain-a-commercially-signed-tls-certificate/#create-a-certificate-signing-request-csr
# see: https://www.namecheap.com/support/knowledgebase/article.aspx/794/67/how-do-i-activate-an-ssl-certificate/
mkdir ~/certs
cd  ~/certs
openssl req -new -newkey rsa:4096 -days 365 -nodes -keyout inalltwelvekeys.com.key -out inalltwelvekeys.com.csr
cat inalltwelvekeys.com.csr
```
  * copy the contents of the file we just cat-ed out (including the header/footer) and submit to namecheap ... follow their process to get cert
  * use the CNAME record verification method, by creating CNAME record in linode DNS records
  * once active, the SSL cert can be obtained from namecheap
  * upload inalltwelvekeys_com.crt and inalltwelvekeys_com.ca-bundle to linode
    * (example: `scp /Users/michael/Downloads/inalltwelvekeys_com/inalltwelvekeys_com.crt root@<ip>:/root/certs/`)
* Configure Server
```shell
ssh root@<ipv4 address>

# apt housekeeping
sudo apt update -y
sudo apt upgrade -y

# install dependencies from using apt
sudo apt install nodejs -y
#sudo apt install npm -y
sudo apt install git -y

# install latest latest version of npm
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update
sudo apt-get install nodejs -y

# clone source code from git
cd ~
sudo git clone https://github.com/michael-dean-haynie/inalltwelvekeys.git

# install npm dependencies
cd inalltwelvekeys
sudo npm install

# configure .env file
cp .env.example.prod .env
# vim into it and update values

# set up system.d
sudo cp inalltwelvekeys.service /etc/systemd/system/inalltwelvekeys.service
sudo systemctl daemon-reload
sudo systemctl enable inalltwelvekeys.service
sudo systemctl start inalltwelvekeys.service
```

## Side Load the UI
```shell
cd ~ || exit
sudo git clone https://github.com/michael-dean-haynie/inalltwelvekeys-ui.git
cd inalltwelvekeys-ui || exit
sudo npm install
sudo npm run deploy
```

## Monitor logs
```shell
sudo journalctl -f -n 100 -u inalltwelvekeys
```
