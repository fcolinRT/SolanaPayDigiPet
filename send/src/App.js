import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';

const {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
  Cluster,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");

const {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  Token,
} = require('@solana/spl-token');

const splToken = require("@solana/spl-token");

const web3 = require("@solana/web3.js");

const {encodeURL, createQR, findTransactionSignature} = require('@solana/pay');

const {BigNumber} = require('bignumber.js')

const axios = require('axios')


function App() {
  const MINUTE_MS = 10000;

  const [isSent, setIsSent] = useState(false);
  const [reference, setRef] = useState(new Keypair().publicKey);
  const [connection, setConnection] = useState(new Connection(clusterApiUrl('devnet'), 'confirmed'));

  const sendTokens = async (toAddress) => {

    console.log("Address")
    console.log(toAddress)

    const firstWinPrivKey = [

    ].slice(0,32);

    let payer = Keypair.fromSeed(Uint8Array.from(firstWinPrivKey));

    const mint = new Token(
        connection,
        new PublicKey("BwAytuXNenvydABq5w1ogf4kyPNo9q8XxQajG8iXrEZF"),
        splToken.TOKEN_PROGRAM_ID,
        payer
    )

    const to = new PublicKey(toAddress)

    const toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        to,
    );

    const fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        payer.publicKey,
    );

    const transaction = new web3.Transaction().add(
        splToken.Token.createTransferInstruction(
            splToken.TOKEN_PROGRAM_ID,
            fromTokenAccount.address,
            toTokenAccount.address,
            payer.publicKey,
            [],
            1,
        ),
    );

    console.log("Yep")
    console.log(transaction)

    // Sign transaction, broadcast, and confirm
    await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
    );

    console.log("Termino")
  }

  useEffect(() => {

    // Connecting to devnet for this example
    console.log('1. ✅ Establish connection to the network');
    //const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    console.log('2. 🛍 Simulate a customer checkout \n');
    const recipient = new PublicKey('AQsiNfeiH7DcvvPDRS5B7kCey1ofiry9paR3gYdQ9D2A');
    const amount = new BigNumber(2);
    const splToken = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');
    //const reference = new Keypair().publicKey;
    const label = 'Atlas Cafe';
    const message = 'Coffee';
    const memo = 'JC#4098';


    console.log('3. 💰 Create a payment request link \n');
    const url = encodeURL({ recipient, amount, splToken, reference, label, message, memo });

    // encode URL in QR code
    const qrCode = createQR(url);

    console.log(qrCode)

    const element = document.getElementById('qr-code');

    console.log("Aca")
    console.log(reference)

    //setRef(reference)

// append QR code to the element
    qrCode.append(element);

  });

  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('\n5. Find the transaction');
      const signatureInfo = await findTransactionSignature(connection, reference, undefined, 'confirmed');
      console.log(signatureInfo.signature)
      const resp = await axios.post('https://explorer-api.devnet.solana.com/', {
        "id": "856296d9-19ce-42bf-9004-df126bcf7673",
        "jsonrpc": "2.0",
        "method": "getConfirmedTransaction",
        "params": [
          signatureInfo.signature
        ]
      });
      console.log("OWNER")
      if (resp.data.result.meta.postTokenBalances && !isSent) {
        console.log(resp.data.result.meta.postTokenBalances[0].owner);
        await sendTokens(resp.data.result.meta.postTokenBalances[0].owner)
      }
    }, MINUTE_MS);

    return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [])


  return (
    <div className="App">
      <div>
        <div id={"qr-code"}>
        </div>
      </div>
    </div>
  );
}

export default App;
