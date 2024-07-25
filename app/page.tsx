"use client";

import SparklesText from "@/components/magicui/sparkles-text";
import { Primer } from "@primer-io/checkout-web";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface KeyValueObject {
  [key: string]: string | number;
}

function parseTextareaValue(text: string): KeyValueObject {
  const lines = text.split("\n");
  const result: KeyValueObject = {};

  lines.forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value !== undefined) {
      result[key.trim()] = isNaN(Number(value.trim()))
        ? value.trim()
        : Number(value.trim());
    }
  });

  return result;
}

const getClientSession = async (data: {
  currencyCode: string;
  amount: number;
  clientInfo: {
    firstName: string;
    lastName: string;
    address: string;
  };
  metadata: string;
}) => {
  const API_KEY = "35b817a6-824d-460f-a1ef-ca07fd3b68d4";
  const CLIENT_SESSION_API = "https://api.sandbox.primer.io/client-session";

  const { amount, currencyCode, clientInfo, metadata } = data;

  try {
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-API-VERSION": "2.2",
        "content-type": "application/json",
        "X-API-KEY": API_KEY
      },
      body: JSON.stringify({
        orderId: "order-123",
        currencyCode: currencyCode,
        amount: Number(`${amount}.00`),
        order: {
          lineItems: [
            {
              itemId: "t-shirt",
              description: "Off-white T-Shirt",
              amount: Number(`${amount}.00`),
              quantity: 1
            }
          ],
          countryCode: "GB"
        },
        customer: {
          firstName: clientInfo.firstName,
          lastName: clientInfo.lastName,
          billingAddress: {
            firstName: clientInfo.firstName,
            lastName: clientInfo.lastName,
            addressLine1: clientInfo.address
          },
          shippingAddress: {
            firstName: clientInfo.firstName,
            lastName: clientInfo.lastName,
            addressLine1: clientInfo.address
          }
        },
        metadata: metadata
      })
    };

    const resp = await fetch(CLIENT_SESSION_API, options);
    const data = await resp.json();

    console.log("clientSessionData", data);

    return data?.clientToken;
  } catch (e) {
    console.error("Error fetching client session", e);
    toast.error("Error fetching client session");
    return null;
  }
};

const initializePrimerCheckout = async (data: any) => {
  try {
    const clientToken = await getClientSession(data);

    if (!clientToken) {
      console.error("Error fetching client token");
      return;
    }

    console.log("clientSessionData", clientToken);

    await Primer.showUniversalCheckout(clientToken, {
      container: "#checkout-container #checkout",
      onCheckoutComplete(data) {
        console.log("Checkout completed", data);
        toast.success("Checkout completed");
      }
    });
  } catch (error) {
    console.error("Error initializing Primer Checkout", error);
  }
};

export default function Home() {
  const [productAmount, setProductAmount] = useState(1000.0);
  const [currency, setCurrency] = useState("EUR");
  const [clientInfo, setClientInfo] = useState({
    firstName: "John",
    lastName: "Smith",
    address: "Real address 33"
  });
  const [metadata, setMetadata] = useState("");

  useEffect(() => {
    initializePrimerCheckout({
      currencyCode: currency,
      amount: productAmount,
      clientInfo: clientInfo,
      metadata: parseTextareaValue(metadata)
    });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 p-10">
      <SparklesText text="Tudor's very limited shop!" />
      <div
        className="flex justify-between w-full gap-10"
        id="checkout-container">
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center">
            <Image src={"/tshirt.jpg"} width={250} height={200} alt="T-Shirt" />
            <div className="flex flex-col gap-3">
              <h2>Name: T-Shirt</h2>
              <div className="flex gap-1">
                <h2>Amount: </h2>
                <input
                  type="number"
                  placeholder="Amount"
                  value={productAmount}
                  onChange={(e) => setProductAmount(Number(e.target.value))}
                  className="max-w-20"
                />
                <input
                  type="text"
                  placeholder="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="max-w-20"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="input-container w-1/2">
                <label htmlFor="first-name">First Name</label>
                <input
                  type="text"
                  id="first-name"
                  value={clientInfo.firstName}
                  onChange={(e) =>
                    setClientInfo({
                      ...clientInfo,
                      firstName: e.target.value
                    })
                  }
                />
              </div>
              <div className="input-container w-1/2">
                <label htmlFor="last-name">Last Name</label>
                <input
                  type="text"
                  id="last-name"
                  value={clientInfo.lastName}
                  onChange={(e) =>
                    setClientInfo({
                      ...clientInfo,
                      lastName: e.target.value
                    })
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                value={clientInfo.address}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    address: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label htmlFor="custom-metadata">Custom Metadata</label>
              <textarea
                id="custom-metadata"
                placeholder="scenario=PAYPAL"
                className="w-full h-20"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
              />
            </div>
          </div>
          <button
            className="mt-auto bg-slate-400 rounded-md p-2 px-3"
            onClick={async () => {
              await initializePrimerCheckout({
                currencyCode: currency,
                amount: productAmount,
                clientInfo: clientInfo,
                metadata: parseTextareaValue(metadata)
              });
            }}>
            Save details
          </button>
        </div>
        <div id="checkout" className="w-1/2"></div>
      </div>
    </main>
  );
}
