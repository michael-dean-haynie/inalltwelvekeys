# inalltwelvekeys

## Steps to configure linode server from scratch
* Go to linode.com and create a new linode
  * Shared CPU - Nanode 1 GB
  * Label it something like "inalltwelvekeys-linode"
  * save root password, ip addresses and such in password manager
* ssh into the linode `ssh root@<ipv4 address>`
* install dependencies
```shell
# apt housekeeping
sudo apt update -y
sudo apt upgrade -y

# install dependencies from using apt
sudo apt install nodejs -y
sudo apt install npm -y
sudo apt install git -y

# create a certificate signing request (for https/wss ssl cert)
# see: https://www.linode.com/docs/guides/obtain-a-commercially-signed-tls-certificate/#create-a-certificate-signing-request-csr
# see: https://www.namecheap.com/support/knowledgebase/article.aspx/794/67/how-do-i-activate-an-ssl-certificate/
mkdir ~/certs
cd  ~/certs
openssl req -new -newkey rsa:4096 -days 365 -nodes -keyout inalltwelvekeys.com.key -out inalltwelvekeys.com.csr
cat inalltwelvekeys.com.csr
# copy the contents of the file we just cat-ed out (including the header/footer) and submit to namecheap ... follow their process to get cert

# clone source code from git
cd ~
sudo git clone https://github.com/michael-dean-haynie/inalltwelvekeys.git

# install npm dependencies
cd inalltwelvekeys
sudo npm install

```
