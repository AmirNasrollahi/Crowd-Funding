import React, { useContext, createContext } from "react";
import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract("0x866281Ab72dB67C37f9F4E8B4e878f6866A83170");
  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );

  const address = useAddress();
  const connect = useMetamask();

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign({
        args: [
          form.title,
          form.description,
          form.target,
          new Date(form.deadline).getTime(),
          form.image
        ]
      });

      console.log("transaction success", data);
    } catch (err) {
      console.log("transaction failure", err);
    }
  };

  const getCampaigns=async ()=>{
    const campaigns=await contract.call('getCampaigns')

    const parseCampaigns= campaigns.map((camapign,i)=>({
      owner:camapign.owner,
      title:camapign.title,
      description:camapign.description,
      target:ethers.utils.formatUnits(camapign.target.toString()),
      deadline:camapign.deadline.toNumber(),
      amountCollected:ethers.utils.formatUnits(camapign.amountCollected.toString()),
      image:camapign.image,
      pid:i
    }))

    return parseCampaigns
  }

  const getUserCampaigns= async()=>{
    const allCampaigns=await getCampaigns()

    const useCampaigns=allCampaigns.filter((camapign)=> camapign.owner===address)

    return useCampaigns
  }

  const donateCampaign=async(campaignId,amount)=>{
    const donateTransaction= await contract.call('donateToCampaign',[campaignId],{value:ethers.utils.parseUnits(amount)})

    return donateTransaction
  }

  const getDonations=async(campaignId)=>{
    const donations=await contract.call('getdonators',[campaignId])
    const numberOfDonations= donations[0].length

    const donationDetails=[]

    for (let i = 0; i < numberOfDonations; i++) {
      donationDetails.push({
        donator:donations[0][i],
        donation:ethers.utils.formatUnits(donations[1][i].toString())
      })
    }

    return donationDetails
  }

  const campaignCompletion=async(campaignId)=>{
    const data=await contract.call('endOfCampaign',[campaignId])
    return data
  }

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donateCampaign,
        getDonations,
        campaignCompletion
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
