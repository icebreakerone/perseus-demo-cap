'use client'
import React, {useEffect, useState} from 'react'

import ViewLoginCAP from '@components/views/ViewLoginCAP'
import ViewSelectEDP from "@components/views/ViewSelectEDP"
import ErrorBoundary from '@/app/error'

import FormCAPLogin from '@components/forms/FormCAPLogin'
import FormCAPSelectEDP from "@components/forms/FormCAPSelectEDP"
import {useRouter, useSearchParams} from 'next/navigation'
import FormEDPLogin from "@components/forms/FormEDPVerifyWithAuth";
import FormEDPVerifyWithMAC from "@components/forms/FormEDPVerifyWithMAC";
import LoginButton from "@components/LoginButton";
import ViewEDPVerified from "@components/views/ViewEDPVerified";
import ViewSelectLender from "@components/views/ViewSelectLender";
import FormCAPSelectLender from "@components/forms/FormCAPSelectLender";
import ViewCAPSharingConsent from "@components/views/ViewCAPSharingConsent";
import FormCAPSharingConsent from "@components/forms/FormCAPSharingConsent";

type TStage = 'loginCAP' | 'selectEDP' | 'connectEDP' | 'edpViaAuth' | 'edpViaMac' | 'edpVerified' | 'selectLender' | 'CAPSharingConsent' | 'CAPComplete'
type TModal = 'edp'

const Home = () => {
  // get search params
  const searchParams = useSearchParams()
  const key = searchParams.get('key')

  // const [processing, setProcessing] = useState<boolean>()

  const [stageId, setStageId] = useState<TStage>('loginCAP')
  const [modalId, setModalId] = useState<TModal|null>(null)
  const [selectedEDP, setSelectedEDP] = useState<string>()
  const [selectedLender, setSelectedLender] = useState<string>()
  const [sharingConsent, setSharingConsent] = useState<boolean>()

  useEffect(() => {
    if (key) {
      // if the requested stageId is part of the edp from then launch as a modal
      if (key.toLowerCase().includes('edp')) {
        setModalId('edp')
      }
      setStageId(key as TStage)
    }
  }, []);

  const router = useRouter()

  /** CAP level */
  const handleLoginCAP = async (e: any) => {
    e.preventDefault()
    /** This is a placeholder for the actual login process.
      * */

    setStageId('selectEDP')
  }

  const handleSelectEDP = async (e: any) => {
    e.preventDefault()
    setSelectedEDP(e.target.value)

    setStageId('connectEDP')
    setModalId('edp')
  }

  const handleSelectLender = async (e: any) => {
    e.preventDefault()
    setSelectedLender(e.target.value)

    setStageId('CAPSharingConsent')
    setModalId(null)
  }

  const handleConfirmShareConsent = async (e: any) => {
    e.preventDefault()
    setSharingConsent(e.target.value)

    setStageId('CAPComplete')
    setModalId(null)
  }

  /** EDP level */


  return (
    <ErrorBoundary>
      <div className="flex h-full flex-col gap-8 overflow-hidden p-8">
        <div className="flex flex-col gap-4 overflow-y-auto">
          {stageId === 'loginCAP' && (
          <ViewLoginCAP>
            <FormCAPLogin onSubmit={handleLoginCAP} />
          </ViewLoginCAP>
          )}

          {stageId === 'selectEDP' && (
          <ViewSelectEDP>
            <FormCAPSelectEDP onSubmit={handleSelectEDP} />
          </ViewSelectEDP>
          )}

          {stageId === 'selectLender' && (
          <ViewSelectLender>
            <FormCAPSelectLender onSubmit={handleSelectLender} />
          </ViewSelectLender>
          )}

          {stageId === 'CAPSharingConsent' && (
          <ViewCAPSharingConsent>
            <FormCAPSharingConsent onSubmit={handleConfirmShareConsent} />
          </ViewCAPSharingConsent>
          )}
        </div>
      </div>
      {modalId !== null && (
        <div className="fixed left-0 right-0 top-0 bottom-0 bg-[rgba(0,0,0,0.5)]">
          <div className="flex bg-white my-[10vh] mx-auto w-[50vw] h-[80vh] rounded-2xl shadow-xl flex-col overflow-hidden">
            <div className="flex flex-col gap-4 p-4 bg-purple-900">
            {modalId === 'edp' && stageId == 'connectEDP' && (
              <h1 className="text-2xl text-white flex-1 text-center font-normal">IB1<strong>EDP | Options</strong></h1>
            )}
            {modalId === 'edp' && stageId == 'edpViaAuth' && (
              <h1 className="text-2xl text-white flex-1 text-center font-normal">IB1<strong>EDP | Access Via Auth</strong></h1>
            )}
            {modalId === 'edp' && stageId == 'edpViaMac' && (
              <h1 className="text-2xl text-white flex-1 text-center font-normal">IB1<strong>EDP | Access Via Mac</strong></h1>
            )}
            </div>

            <div className="flex flex-col gap-4 p-8 bg-purple-200 flex-1">
            {modalId === 'edp' && stageId === 'connectEDP' && (
              <>
                <p>IB1CAP is asking to retrieve your detailed electricity consumption data. For this, they require proof of your address.</p>
                <p>Please click on the relevant icon below for your preferred option of authorising your smart meter:</p>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-row flex-1 items-center justify-between">
                    <label className="flex-1" htmlFor="portal">via your logging onto your IB1<strong>EDP</strong> portal</label>
                    <LoginButton />
                  </div>
                  <div className="flex flex-row flex-1 items-center justify-between">
                    <label className="flex-1" htmlFor="portal">via your MAC number from your smart
                      meter display</label>
                    <button className="bg-purple-500 text-white px-4 py-2 rounded-[50px] w-[7rem] hover:bg-purple-800" id="portal" onClick={() => setStageId('edpViaMac')}>GO</button>
                  </div>
                  <div className="flex flex-row flex-1 items-center justify-between">
                    <label className="flex-1" htmlFor="portal">via lender authorisation</label>
                    <button className="bg-purple-500 text-white px-4 py-2 rounded-[50px] w-[7rem] hover:bg-purple-800" id="portal">GO</button>
                  </div>
                  <div className="flex flex-row flex-1 items-center justify-between">
                    <label className="flex-1" htmlFor="portal">via a scan of your bill<span className="block text-xs text-gray-500">(by uploading a PDF scan)</span></label>
                    <button className="bg-purple-500 text-white px-4 py-2 rounded-[50px] w-[7rem] hover:bg-purple-800" id="portal">GO</button>
                  </div>
                </div>
              </>
            )}
            {modalId === 'edp' && stageId === 'edpViaAuth' && (
              <>
                <p>IB1<strong>CAP</strong> is asking to retrieve your detailed electricity consumption data to calculate your emissions report.</p>
                <p>Please log in below to access your IB1<strong>EDP</strong> account and authorise the data transfer.</p>
                <div className="flex flex-col gap-4">
                  <FormEDPLogin onSubmit={() => {} } />
                </div>
              </>
            )}
            {modalId === 'edp' && stageId === 'edpViaMac' && (
              <>
                <p>IB1<strong>CAP</strong> is asking to retrieve your detailed electricity consumption data. For this, they require proof of your address.</p>
                <p>Please click on the relevant icon below for your preferred option of authorising your smart meter:</p>
                <div className="flex flex-col gap-4">
                  <FormEDPVerifyWithMAC onSubmit={() => {} } />
                </div>
              </>
            )}
            {modalId === 'edp' && stageId === 'edpVerified' && (
              <>
                <p>IB1<strong>CAP</strong> is asking to retrieve your detailed electricity consumption data. For this, they require proof of your address.</p>
                <p>Please click on the relevant icon below for your preferred option of authorising your smart meter:</p>
                <div className="flex flex-col gap-4">
                  <ViewEDPVerified onClose={() => {
                    setStageId('selectLender')
                    setModalId(null)
                  }} />
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  )
}

export default Home
