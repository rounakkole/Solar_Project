import React, { useState } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'

export default function QuotationBuilder({ cart, customerId }) {
  const [validity, setValidity] = useState(30)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const generateQuotation = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/quotations', {
        customer_id: customerId,
        items: cart.items,
        validity_days: validity,
        notes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      alert('Quotation created! ' + response.data.data.quotation_number)
      
      // Download PDF
      downloadQuotationPDF(response.data.data.quotation_id)
    } catch (error) {
      alert('Failed to create quotation: ' + error.response.data.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadQuotationPDF = async (quotationId) => {
    try {
      const response = await axios.get(`/api/quotations/${quotationId}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `quotation-${quotationId}.pdf`)
      document.body.appendChild(link)
      link.click()
    } catch (error) {
      alert('Failed to download PDF')
    }
  }

  return (
    <div>
      <h3>Generate Quotation</h3>
      <div>
        <label>
          Validity (days):
          <input 
            type="number" 
            value={validity} 
            onChange={(e) => setValidity(parseInt(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Notes:
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any special notes..."
          />
        </label>
      </div>
      <button 
        onClick={generateQuotation}
        disabled={loading || cart.items.length === 0}
      >
        {loading ? 'Generating...' : 'Generate & Download PDF'}
      </button>
    </div>
  )
}
