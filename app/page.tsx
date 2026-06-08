'use client'
import React, { useEffect, useState } from 'react'

import ViewLoginCAP from '@components/views/ViewLoginCAP'
import ViewSelectEDP from '@components/views/ViewSelectEDP'
import ErrorBoundary from '@/app/error'

import FormCAPLogin from '@components/forms/FormCAPLogin'
import FormCAPSelectEDP from '@components/forms/FormCAPSelectEDP'
import { useSearchParams } from 'next/navigation'
import FormEDPLogin from '@components/forms/FormEDPVerifyWithAuth'
import FormEDPVerifyWithMAC from '@components/forms/FormEDPVerifyWithMAC'
import LoginButton from '@components/LoginButton'
import ViewEDPVerified from '@components/views/ViewEDPVerified'
import ViewSelectLender from '@components/views/ViewSelectLender'
import FormCAPSelectLender from '@components/forms/FormCAPSelectLender'
import ViewCAPSharingConsent from '@components/views/ViewCAPSharingConsent'
import FormCAPSharingConsent from '@components/forms/FormCAPSharingConsent'
import ViewSharingConsentBank from '@components/views/ViewSharingConsentBank'
import FormSharingConsentBank from '@components/forms/FormSharingConsentBank'
import ViewCAPSetupComplete from '@components/views/ViewCAPSetupComplete'
import ViewRetrieveEDP from '@components/views/ViewRetrieveEDP'
import StagesBar from '@components/StagesBar'
// import FormCAPSetupComplete from '@components/forms/FormCAPSetupComplete'

type TStage =
  | 'loginCAP'
  | 'selectEDP'
  | 'SharingConsentBank'
  | 'connectEDP'
  | 'edpViaAuth'
  | 'edpViaMac'
  | 'edpVerified'
  | 'retrieveEDP'
  | 'selectLender'
  | 'CAPSharingConsent'
  | 'CAPComplete'
type TModal = 'edp'

type TStep = 1 | 2 | 3 | 4 | 5 | 6
const STAGE_TO_STEP: Partial<Record<TStage, TStep>> = {
  selectEDP: 1,
  SharingConsentBank: 2,
  retrieveEDP: 3,
  selectLender: 4,
  CAPSharingConsent: 5,
  CAPComplete: 6,
}

const Home = () => {
  // get search params
  const searchParams = useSearchParams()
  const key = searchParams.get('key')

  // const [processing, setProcessing] = useState<boolean>()

  // Seed initial stage/modal from the optional ?key= deep-link param (read once at mount).
  // Done via lazy initializers rather than an effect to avoid a cascading re-render and the
  // brief flash of the login screen before jumping to the deep-linked stage.
  const [stageId, setStageId] = useState<TStage>(() =>
    key ? (key as TStage) : 'loginCAP',
  )
  const [modalId, setModalId] = useState<TModal | null>(() =>
    key?.toLowerCase().includes('edp') ? 'edp' : null,
  )
  const [selectedEDP, setSelectedEDP] = useState<string>()
  const [selectedLender, setSelectedLender] = useState<string>()
  const [sharingConsent, setSharingConsent] = useState<boolean>()

  console.log('stageId', stageId)
  console.log('modalId', modalId)
  console.log('selectedEDP', selectedEDP)
  console.log('selectedLender', selectedLender)
  console.log('sharingConsent', sharingConsent)

  useEffect(() => {
    if (stageId !== 'retrieveEDP') return
    const t = setTimeout(() => setStageId('selectLender'), 2000)
    return () => clearTimeout(t)
  }, [stageId])

  /** CAP level */
  const handleLoginCAP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    /** This is a placeholder for the actual login process.
     * */
    setStageId('selectEDP')
  }

  const handleSelectEDP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSelectedEDP((e.target as HTMLInputElement).value)
    setStageId('SharingConsentBank')
    setModalId(null)
  }
  const handleConfirmShareConsentBank = async (value: boolean) => {
    setSharingConsent(value)
    setStageId('connectEDP')
    setModalId('edp')
  }

  const handleSelectLender = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSelectedLender((e.target as HTMLInputElement).value)
    setStageId('CAPSharingConsent')
    setModalId(null)
  }
  const handleConfirmShareConsent = async (value: boolean) => {
    setSharingConsent(value)
    setStageId('CAPComplete')
    setModalId(null)
  }

  /*
  const handleGotoEDPSelection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStageId('selectEDP')
  }
  const handleGotoLenderSelection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStageId('selectLender')
  }
  */

  /** EDP level */

  const currentStep = STAGE_TO_STEP[stageId]
  const showStagesBar = modalId === null && currentStep !== undefined

  return (
    <ErrorBoundary>
      <div className="flex h-full flex-col overflow-hidden">
        {showStagesBar && <StagesBar currentStep={currentStep as TStep} />}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-8">
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

          {stageId === 'SharingConsentBank' && (
            <ViewSharingConsentBank>
              <FormSharingConsentBank
                onSubmit={handleConfirmShareConsentBank}
              />
            </ViewSharingConsentBank>
          )}

          {stageId === 'retrieveEDP' && <ViewRetrieveEDP />}

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

          {stageId === 'CAPComplete' && <ViewCAPSetupComplete />}
          {/*
          <ViewCAPSetupComplete>
            <FormCAPSetupComplete onGotoEDPSelection={handleGotoEDPSelection} onGotoLender={handleGotoLenderSelection} />
          </ViewCAPSetupComplete>
          */}
        </div>
      </div>
      {modalId !== null && (
        <div className="fixed top-0 right-0 bottom-0 left-0 bg-[rgba(0,0,0,0.5)]">
          <div className="mx-auto my-[10vh] flex h-[80vh] w-[50vw] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex flex-col gap-4 bg-green-900 p-4">
              {modalId === 'edp' && stageId == 'connectEDP' && (
                <h1 className="flex-1 text-center text-2xl font-normal text-white">
                  IB1 EDP | Options
                </h1>
              )}
              {modalId === 'edp' && stageId == 'edpViaAuth' && (
                <h1 className="flex-1 text-center text-2xl font-normal text-white">
                  IB1 EDP | Access Via Auth
                </h1>
              )}
              {modalId === 'edp' && stageId == 'edpViaMac' && (
                <h1 className="flex-1 text-center text-2xl font-normal text-white">
                  IB1 EDP | Access Via Mac
                </h1>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-4 bg-green-200 p-8">
              {modalId === 'edp' && stageId === 'connectEDP' && (
                <>
                  <p>
                    To retrieve your smart meter data, please sign in or provide
                    proof of your address
                  </p>
                  <p>
                    Please click on the relevant icon below for your preferred
                    option of authorising your smart meter:
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-1 flex-row items-center justify-between">
                      <label className="flex-1" htmlFor="portal">
                        via your logging onto your IB1 EDP portal
                      </label>
                      <LoginButton />
                    </div>
                    <div className="flex flex-1 flex-row items-center justify-between">
                      <label className="flex-1" htmlFor="portal">
                        via your MAC number from your smart meter display
                      </label>
                      <button
                        className="w-[7rem] cursor-not-allowed rounded-[50px] bg-gray-400 px-4 py-2 text-white"
                        disabled
                        id="portal"
                      >
                        GO
                      </button>
                    </div>
                    <div className="flex flex-1 flex-row items-center justify-between">
                      <label className="flex-1" htmlFor="portal">
                        via lender authorisation
                      </label>
                      <button
                        className="w-[7rem] cursor-not-allowed rounded-[50px] bg-gray-400 px-4 py-2 text-white"
                        disabled
                        id="portal"
                      >
                        GO
                      </button>
                    </div>
                    <div className="flex flex-1 flex-row items-center justify-between">
                      <label className="flex-1" htmlFor="portal">
                        via a scan of your bill
                        <span className="block text-xs text-gray-500">
                          (by uploading a PDF scan)
                        </span>
                      </label>
                      <button
                        className="w-[7rem] cursor-not-allowed rounded-[50px] bg-gray-400 px-4 py-2 text-white"
                        disabled
                        id="portal"
                      >
                        GO
                      </button>
                    </div>
                  </div>
                </>
              )}

              {modalId === 'edp' && stageId === 'edpViaAuth' && (
                <>
                  <p>
                    IB1 CAP is asking to retrieve your detailed electricity
                    consumption data to calculate your emissions report.
                  </p>
                  <p>
                    Please log in below to access your IB1 EDP account and
                    authorise the data transfer.
                  </p>
                  <div className="flex flex-col gap-4">
                    <FormEDPLogin onSubmit={() => {}} />
                  </div>
                </>
              )}

              {modalId === 'edp' && stageId === 'edpViaMac' && (
                <>
                  <p>
                    IB1 CAP is asking to retrieve your detailed electricity
                    electricity consumption data. For this, they require proof
                    of your address.
                  </p>
                  <p>
                    Please click on the relevant icon below for your preferred
                    option of authorising your smart meter:
                  </p>
                  <div className="flex flex-col gap-4">
                    <FormEDPVerifyWithMAC onSubmit={() => {}} />
                  </div>
                </>
              )}

              {modalId === 'edp' && stageId === 'edpVerified' && (
                <>
                  <p>
                    <strong>Good news</strong>, we have confirmed your address
                    and allowed IB1 CAP to retrieve your smart meter data.
                  </p>
                  <p>You may now return to IB1 CAP</p>
                  <div className="flex flex-col gap-4">
                    <ViewEDPVerified
                      onClose={() => {
                        setStageId('retrieveEDP')
                        setModalId(null)
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/*
      <div className="fixed bottom-0 right-0 flex flex-col gap-2 p-8 text-lg text-red-500">
        <span>stageId: {stageId}</span>
        <span>modalId: {modalId}</span>
        <span>selectedEDP: {selectedEDP}</span>
        <span>selectedLender: {selectedLender}</span>
        <span>sharingConsent: {sharingConsent}</span>
      </div>
      */}
    </ErrorBoundary>
  )
}

export default Home
