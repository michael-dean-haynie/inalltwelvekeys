# inalltwelvekeys

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
* 
```shell
ssh root@<ipv4 address>

# apt housekeeping
sudo apt update -y
sudo apt upgrade -y

# install dependencies from using apt
sudo apt install nodejs -y
sudo apt install npm -y
sudo apt install git -y

# clone source code from git
cd ~
sudo git clone https://github.com/michael-dean-haynie/inalltwelvekeys.git

# install npm dependencies
cd inalltwelvekeys
sudo npm install

# configure .env file
cp .env.example .env
# vim into it and update values
```
