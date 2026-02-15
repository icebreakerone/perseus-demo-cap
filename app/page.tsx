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
import ViewCAPSetupComplete from '@components/views/ViewCAPSetupComplete'
import FormCAPSetupComplete from '@components/forms/FormCAPSetupComplete'

type TStage =
  | 'loginCAP'
  | 'selectEDP'
  | 'connectEDP'
  | 'edpViaAuth'
  | 'edpViaMac'
  | 'edpVerified'
  | 'selectLender'
  | 'CAPSharingConsent'
  | 'CAPComplete'
type TModal = 'edp'

const Home = () => {
  // get search params
  const searchParams = useSearchParams()
  const key = searchParams.get('key')

  // const [processing, setProcessing] = useState<boolean>()

  const [stageId, setStageId] = useState<TStage>('loginCAP')
  const [modalId, setModalId] = useState<TModal | null>(null)
  const [selectedEDP, setSelectedEDP] = useState<string>()
  const [selectedLender, setSelectedLender] = useState<string>()
  const [sharingConsent, setSharingConsent] = useState<boolean>()

  useEffect(() => {
    if (key) {
      // if the requested stageId is part of the edp from then launch as a modal
      if (key.toLowerCase().includes('edp')) setModalId('edp')
      setStageId(key as TStage)
    }
  }, [])

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

  const handleGotoEDPSelection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStageId('selectEDP')
  }
  const handleGotoLenderSelection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStageId('selectLender')
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

          {stageId === 'CAPComplete' && (
            <ViewCAPSetupComplete>
              <FormCAPSetupComplete onGotoEDPSelection={handleGotoEDPSelection} onGotoLender={handleGotoLenderSelection} />
            </ViewCAPSetupComplete>
          )}
        </div>
      </div>
      {modalId !== null && (
        <div className="fixed bottom-0 left-0 right-0 top-0 bg-[rgba(0,0,0,0.5)]">
          <div className="mx-auto my-[10vh] flex h-[80vh] w-[50vw] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex flex-col gap-4 bg-purple-900 p-4">
              {modalId === 'edp' && stageId == 'connectEDP' && (
                <h1 className="flex-1 text-center text-2xl font-normal text-white">
                  IB1 <strong>EDP</strong> | Options
                </h1>
              )}
              {modalId === 'edp' && stageId == 'edpViaAuth' && (
                <h1 className="flex-1 text-center text-2xl font-normal text-white">
                  IB1<strong>EDP</strong> | Access Via Auth
                </h1>
              )}
              {modalId === 'edp' && stageId == 'edpViaMac' && (
                <h1 className="flex-1 text-center text-2xl font-normal text-white">
                  IB1<strong>EDP</strong> | Access Via Mac
                </h1>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-4 bg-purple-200 p-8">
              {modalId === 'edp' && stageId === 'connectEDP' && (
                <>
                  <p>
                    IB1<strong>CAP</strong> is asking to retrieve your detailed
                    electricity electricity consumption data. For this, they
                    require proof address.
                  </p>
                  <p>
                    Please click on the relevant icon below for your preferred
                    option of authorising your smart meter:
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-1 flex-row items-center justify-between">
                      <label className="flex-1" htmlFor="portal">
                        via your logging onto your IB1<strong>EDP</strong>{' '}
                        portal
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
                    IB1<strong>CAP</strong> is asking to retrieve your detailed
                    electricity consumption data to calculate your emissions
                    report.
                  </p>
                  <p>
                    Please log in below to access your IB1<strong>EDP</strong>{' '}
                    account and authorise the data transfer.
                  </p>
                  <div className="flex flex-col gap-4">
                    <FormEDPLogin onSubmit={() => {}} />
                  </div>
                </>
              )}

              {modalId === 'edp' && stageId === 'edpViaMac' && (
                <>
                  <p>
                    IB1<strong>CAP</strong> is asking to retrieve your detailed
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
                    and allowed Sage Earth to retrieve your smart meter data.
                  </p>
                  <p>You may now return to Sage Earth</p>
                  <div className="flex flex-col gap-4">
                    <ViewEDPVerified
                      onClose={() => {
                        setStageId('selectLender')
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
      <div className="fixed bottom-0 right-0 flex flex-col gap-2 p-8 text-lg text-red-500">
        <span>stageId: {stageId}</span>
        <span>modalId: {modalId}</span>
        <span>selectedEDP: {selectedEDP}</span>
        <span>selectedLender: {selectedLender}</span>
        <span>sharingConsent: {sharingConsent}</span>
      </div>
    </ErrorBoundary>
  )
}

export default Home
