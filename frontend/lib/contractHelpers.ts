import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "./constants";
import { LostAndFoundABI, FinderNFTABI } from "./abis";

export function getLostAndFoundContract(providerOrSigner: any) {
  if (!providerOrSigner) return null;
  return new ethers.Contract(
    CONTRACT_ADDRESSES.LostAndFound,
    LostAndFoundABI,
    providerOrSigner
  );
}

export function getFinderNFTContract(providerOrSigner: any) {
  if (!providerOrSigner) return null;
  return new ethers.Contract(
    CONTRACT_ADDRESSES.FinderNFT,
    FinderNFTABI,
    providerOrSigner
  );
}
