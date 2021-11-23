import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import MyEpicNFT from "./utils/MyEpicNFT.json";

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const CONTRACT_ADDRESS = "0x4F09D52dB2d53785c97702B29C7441E55570eEbC";
const OPENSEA_LINK =
  "https://testnets.opensea.io/collection/squarenft-cf2us9vzoh";

const mintingStates = {
  MINTING: "MINTING",
  MINTED: "MINTED",
};

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mintingState, setMintingState] = useState(null);
  const [tokenLink, setTokenLink] = useState(null);
  const [mintNumbers, setMintNumbers] = useState({
    totalMinted: null,
    leftToMint: null,
  });

  const updateCurrentMinted = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          MyEpicNFT.abi,
          signer
        );

        console.log("checking how many nfts have been minted so far...");

        const { totalMinted, leftToMint } =
          await connectedContract.getCurrentMinted();
        console.log(
          "total minted: ",
          totalMinted.toNumber(),
          "left to mint: ",
          leftToMint.toNumber()
        );

        setMintNumbers({
          totalMinted: totalMinted.toNumber(),
          leftToMint: leftToMint.toNumber(),
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      setMintingState(mintingStates.MINTING);
      const { ethereum } = window;

      if (ethereum) {
        let chainId = await ethereum.request({ method: "eth_chainId" });
        console.log("Connected to chain " + chainId);

        // String, hex code of the chainId of the Rinkebey test network
        const rinkebyChainId = "0x4";
        if (chainId !== rinkebyChainId) {
          alert("You are not connected to the Rinkeby Test Network!");
          setMintingState(null);
          return;
        }

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          MyEpicNFT.abi,
          signer
        );

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          const tokenLink = `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`;
          console.log(tokenLink);
          updateCurrentMinted();
          setMintingState(mintingStates.MINTED);
          setTokenLink(tokenLink);
          // !!! display link to token on opensea
        });

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.");
        await nftTxn.wait();

        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
    updateCurrentMinted();
  }, []);

  const { totalMinted, leftToMint } = mintNumbers;

  console.log("mintingStatus", mintingState);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">NFparTy</p>
          <p className="sub-text">
            Such unique. Many Fun. Discover your NFT today
            <span className="excl-mark">!</span>
          </p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <div>
              {totalMinted != null && (
                <span className="mint-count">
                  Minted {totalMinted} / {totalMinted + leftToMint}
                </span>
              )}

              <button
                onClick={askContractToMintNft}
                className={`cta-button mint-button ${
                  leftToMint < 1 ? "mint-button--out" : ""
                }`}
                disabled={
                  leftToMint < 1 || mintingState === mintingStates.MINTING
                    ? true
                    : false
                }
              >
                {mintingState == mintingStates.MINTING
                  ? "minting..."
                  : leftToMint < 1
                  ? "Sorry we're all out!"
                  : "Mint NFT"}
              </button>
            </div>
          )}
        </div>
        <div className="token-link-container">
          {(() => {
            if (tokenLink && mintingState === mintingStates.MINTED) {
              return (
                <>
                  <a className="token-link" href={tokenLink} target="_blank">
                    Check out your token on opensea
                  </a>
                  <p>
                    (You may need to wait as it can take up to 10 minutes before
                    it shows up!)
                  </p>
                </>
              );
            }
            if (mintingState === mintingStates.MINTING) {
              return <div className="lds-dual-ring"></div>;
            }
          })()}
        </div>
        <footer>
          <a
            className="cta-button opensea-button"
            href={OPENSEA_LINK}
            target="_blank"
          >
            check out this collection on opensea
          </a>
          <div className="footer-container">
            <img
              alt="Twitter Logo"
              className="twitter-logo"
              src={twitterLogo}
            />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built on @${TWITTER_HANDLE}`}</a>{" "}
            <span className="footer-by">by</span>
            <a
              className="footer-text"
              href="https://twitter.com/subject026"
              target="_blank"
              rel="noreferrer"
            >
              @subject026
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
