'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'

interface IProps {
  children: React.ReactElement
}

const ViewCAPSharingConsent = ({ children }: IProps) => {
  return (
    <ErrorBoundary>
      <p>
        Please click below to confirm your consent for IB1 CAP to share your
        calculated emissions data from IB1 EDP with IB1 Bank.
      </p>

      <div className="overflow-y-auto overflow-x-hidden">
        {/*
        <h2 className="mb-2 border-b-2 border-gray-400 text-lg">
          Interpretation
        </h2>
        <p>
          These license terms are intended for use as the ib1:licenseTerms
          property of an RDF resource of type ib1:License (&quot;this
          License&quot;). Where this License is applied (see below) it will give
          effect to a license on these license terms. This Schedule will be
          recorded as standard in the Registry, a copy is presented below for
          transparency.
        </p>

        <h2 className="mb-2 mt-4 border-b-2 border-gray-400 text-lg">
          Definitions
        </h2>
        <h3 className="text-md">RDF properties</h3>
        <p>
          These terms will refer to a number of properties and RDF data types of
          that resource with abbreviated URLs using the specification in the
          Turtle language defined by the W3C.
        </p>
        <p>
          Accordingly any term consisting of two words separated by a colon
          absent any intervening white space - in other words in the form as
          &quot;prefix:name&quot; - shall be interpreted as a URL where the
          first word is expanded to the URL prefix in the table below, with the
          second word appended.
        </p>
        <p>Prefix namespaces used in this license are:</p>
        <p>ib1 https://registry.trust.ib1.org/ns/1.0#</p>

        <h2 className="mb-2 mt-4 border-b-2 border-gray-400 text-lg">
          Other definitions
        </h2>
        <p>In these terms:</p>
        <p>
          &quot;Member&quot;. &quot;Data Provider&quot; and &quot;Catalog
          Entry&quot; are defined in the ib1:trustFramework &quot;Grantor&quot;
          means the Member identified by the certificate which signs the
          transfer step (defined below).
        </p>
        <p>
          &quot;Grantee&quot; means the Member identified by the &quot;to&quot;
          property of the transfer step.
        </p>
        <p>&quot;Data&quot; means the data identified by the transfer step.</p>
        <p>
          &quot;Its data rights&quot; in relation to a Member and specific data,
          means those property rights capable of subsisting in data, and in
          particular the sui generis database right, that either belong to it,
          or which are licensed to it.
        </p>

        <h2 className="mb-2 mt-4 border-b-2 border-gray-400 text-lg">
          Application of these terms
        </h2>
        <p>
          This License may be applied to any transfer of data by including the
          URL of the ib1:License resource in the Registry in a transfer step
          (&quot;this transfer step&quot;) of a provenance record accompanying
          that transfer, where a &quot;transfer step&quot; is an association of
          keys with values, such as a JavaScript Object Notation (JSON) file and
          &apos;including&apos; a license means that the &apos;license&apos;
          value contains a URL to the ib1:License.
        </p>

        <h2 className="mb-2 mt-4 border-b-2 border-gray-400 text-lg">
          License grant
        </h2>
        <p className="mb-2">
          The Grantor grants a license over its data rights in the Data to the
          Grantee, a non-exclusive, non-transferrable, royalty-free, irrevocable
          license to use the data for any ib1:permittedUse, subject to the
          following conditions:
        </p>
        <ul className="mb-2 ml-4">
          <li>
            * If the ib1:scheme imposes further conditions of use, for example
            relating to the protection of personal data, those conditions shall
            apply;
          </li>
          <li>
            * If the license includes an ib1:permissionText term, the party
            providing the data must adhere to the Scheme Policies defining the
            correct use of Perseus permission text and associated evidencing
            processes
          </li>
          <li>
            * If the ib1:licenseDuration term is present, the license shall
            cease after that time interval from the timestamp property in the
            transfer step.
          </li>
          <li>
            * Use of the data is restricted to a territory specified as an
            ib1:licenseTerritory term if that term is present
          </li>
          <li>
            * Any additional conditions specified as ib1:additionalCondition
            term.
          </li>
        </ul>

        <p className="mb-2">
          Where an ib1:permittedUse property permits the transfer of the data to
          data to another Member (&quot;the recipient&quot;) then the license
          includes a right to sublicense to the recipient on these terms,
          provided that the license metadata accompanying the sublicense
          complies with the applicable license terms specified in the
          ib1:scheme.
        </p>

        <p className="mb-2">
          In interpreting the text of an ib1:permittedUse property, the term
          &quot;consumer&quot; refers to any person, whether natural or legal,
        </p>

        <p className="mb-2">
          This license is to be interpreted in accordance with the law of
          England and Wales.
        </p>
        */}

        <p className="mb-2">
          As a reminder, IB1 CAP (“we”) need to have your consent to access the
          following data provided by IB1 EDP:
        </p>
        <ul className="mb-2 ml-4">
          <li>
            * Your electricity and gas consumption (taken every 30 minutes)
          </li>
          <li>* Electricity and gas tariff data</li>
        </ul>

        <p className="mb-2">
          In order to compute the following (“emissions data”):
        </p>
        <ul className="mb-2 ml-4">
          <li>
            * An estimate of your current GHG emissions, sourced from the
            preceding 12 months of data where available
          </li>
          <li>
            * An estimate of projected emissions following any proposed
            intervention(s) that could be financed: a one-off estimate prior to
            the intervention, delivered once
          </li>
          <li>
            * A periodic update to corroborate projected emissions savings:
            derived GHG emissions at monthly resolution, delivered annually
          </li>
        </ul>

        <p className="mb-2">and then use the emissions data as follows:</p>
        <ul className="mb-2 ml-4">
          <li>
            * Share it with your chosen financial service provider(s) to
            facilitate your access to green finance products from that provider
            or providers.
          </li>
          <li>
            * Produce personalised recommendations of actions that your business
            could take to decarbonise (either financed or non-financed)
          </li>
        </ul>

        <p className="mb-2">
          <i>For customers providing data via a smart meter:</i>
        </p>

        <p className="mb-2">
          We use the IB1 EDP service that interfaces with the national smart
          meter systems and other energy industry databases in order to collect,
          store, manage and share your smart data with us. Their service
          operates in compliance with the Smart Energy Code
          (https://smartenergycodecompany.co.uk). You can find out more about
          IB1 EDP and its privacy policy here [EDP privacy policy link].
        </p>

        <p className="mb-2">
          Now, on behalf of [FSP], we seek your consent for them to process the
          emissions data:
        </p>
        <ul className="mb-2 ml-4">
          <li>
            * In order to consider your eligibility for green finance products
          </li>
          <li>
            * If you are offered any green finance products as a consequence of
            our providing emissions data to them, in order to allow them to
            manage your use of that product, including monitoring your
            compliance with any conditions imposed by it.
          </li>
        </ul>

        <p className="mb-2">
          You can withdraw your consent at any time by [CAP process], at which
          point we and your financial service provider will stop processing your
          data. If you choose not to consent or you withdraw your consent you
          will not be able to receive personalised recommendations from us and
          your finance provider may refuse to consider, offer you, or revoke
          your access to, green finance products or services.
        </p>

        <p className="mb-2">
          For more information on how we use your information and your rights
          under the GDPR, please see the{' '}
          <a href="https://registry.core.trust.ib1.org/scheme/perseus/policy/information-provision/2026-03-12">
            Perseus Information Provision Policy.
          </a>
        </p>

        <p className="mb-2">
          This consent will expire one year after it is granted unless renewed
          by you.
        </p>
      </div>

      <div className="ml-8">{children}</div>
    </ErrorBoundary>
  )
}

export default ViewCAPSharingConsent
