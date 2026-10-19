import { FormFlow } from '../forms/FormFlow'
import { contactFlow } from '../forms/flows'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PageIntro } from '../components/PageIntro'

export default function Contact() {
  useDocumentTitle('Contact')
  return (
    <>
      <PageIntro eyebrow="Contact" title="Ask us anything.">
        <p>About a stay, a particular home or the concept itself. This is a demonstration form: it ends with a local preview and nothing is sent. There is no phone line or inbox behind it.</p>
      </PageIntro>
      <section className="container form-section form-section--narrow" aria-label="Contact form">
        <FormFlow flow={contactFlow} referencePrefix="NC" restartLabel="Write another message" doneLinks={[{ label: 'Explore apartments', to: '/apartments' }]} />
      </section>
    </>
  )
}
