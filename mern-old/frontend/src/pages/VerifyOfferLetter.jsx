import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import VerifyOfferLetterForm from '../components/offerletters/VerifyOfferLetterForm'

const VerifyOfferLetter = () => {
  const { id } = useParams()
  const location = useLocation()
  const [offerId, setOfferId] = useState(null)
  
  useEffect(() => {
    // Check for offer letter ID in route parameter
    if (id) {
      setOfferId(id)
    } 
    // Check for offer letter ID in hash fragment (for backward compatibility)
    else if (location.hash) {
      const hashId = location.hash.substring(1) // Remove the # symbol
      if (hashId) {
        setOfferId(hashId)
      }
    }
  }, [id, location.hash])
  
  return (
    <div className='pt-20 md:pt-16 lg:pt-20 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 2xl:px-64 max-w-screen-2xl mx-auto min-h-screen'>
      <VerifyOfferLetterForm offerId={offerId} />
    </div>
  )
}

export default VerifyOfferLetter
