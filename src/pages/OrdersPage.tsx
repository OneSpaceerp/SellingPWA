import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { apiService, type SalesOrder } from '../services/apiService';
import { useSettingsStore } from '../store/settingsStore';
import { Title, TextInput, SimpleGrid, Card, Text, Group, rem, Center, Loader, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconCreditCard } from '@tabler/icons-react';

export function OrdersPage() {
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [detailedOrder, setDetailedOrder] = useState<SalesOrder | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [modeOfPayments, setModeOfPayments] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printScale, setPrintScale] = useState(1);
  const currency = useSettingsStore((state) => state.currency);
  const user = authService.getLoggedInUser();


  const handlePrintPreview = () => {
    if (!detailedOrder) {
      console.error('No order data available for printing');
      return;
    }
    console.log('Opening print preview for order:', detailedOrder);
    console.log('Advance paid value:', detailedOrder.advance_paid);
    console.log('Grand total value:', detailedOrder.grand_total);
    console.log('Outstanding calculation:', detailedOrder.grand_total - (detailedOrder.advance_paid || 0));
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    console.log('Starting print process...');
    
    if (!detailedOrder) {
      console.error('No order data available for printing');
      return;
    }
    
    try {
      // Calculate values to ensure they're properly computed
      const advancePaid = detailedOrder.advance_paid || 0;
      const grandTotal = detailedOrder.grand_total || 0;
      const outstanding = grandTotal - advancePaid;
      
      console.log('Print Calculations:');
      console.log('Advance Paid:', advancePaid);
      console.log('Grand Total:', grandTotal);
      console.log('Outstanding:', outstanding);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        console.error('Could not open print window - popup blocked');
        notifications.show({
          title: 'Print Error',
          message: 'Please allow popups for this site to enable printing',
          color: 'red',
        });
        return;
      }
      
      // Create the print content HTML with responsive design
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order ${detailedOrder.name}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
                color: #333;
                line-height: 1.6;
              }
              .back-button {
                position: fixed;
                top: 20px;
                left: 20px;
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              }
              .back-button:hover {
                background: #0056b3;
              }
              .print-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              .header { 
                text-align: center; 
                padding: 30px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
              .header h2 { margin: 10px 0 0; font-size: 1.5em; opacity: 0.9; }
              .order-info { 
                padding: 30px; 
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
              }
              .info-item {
                background: white;
                padding: 15px;
                border-radius: 6px;
                border-left: 4px solid #667eea;
              }
              .info-item strong { color: #495057; }
              .status-badges {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 15px;
              }
              .status { 
                display: inline-block; 
                padding: 6px 12px; 
                border-radius: 20px; 
                color: white; 
                font-weight: 600;
                font-size: 0.9em;
              }
              .status.approved { background: linear-gradient(45deg, #28a745, #20c997); }
              .status.fully-paid { background: linear-gradient(45deg, #28a745, #20c997); }
              .status.partially-paid { background: linear-gradient(45deg, #007bff, #6f42c1); }
              .status.not-paid { background: linear-gradient(45deg, #dc3545, #e83e8c); }
              .items-section {
                padding: 30px;
              }
              .items-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .items-table th { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                text-align: left;
                font-weight: 600;
              }
              .items-table td { 
                padding: 15px;
                border-bottom: 1px solid #e9ecef;
              }
              .items-table tr:hover {
                background: #f8f9fa;
              }
              .totals { 
                padding: 30px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
              }
              .totals-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                max-width: 400px;
                margin-left: auto;
              }
              .total-item {
                background: white;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
                border: 2px solid #e9ecef;
              }
              .total-item.final {
                border-color: #28a745;
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                font-weight: bold;
              }
              .total-item.outstanding {
                border-color: #dc3545;
                background: linear-gradient(135deg, #dc3545, #e83e8c);
                color: white;
                font-weight: bold;
              }
              @media print {
                .back-button { display: none !important; }
                body { margin: 0; padding: 0; }
                .print-container { box-shadow: none; border-radius: 0; }
                .header { background: #667eea !important; -webkit-print-color-adjust: exact; }
                .status.approved, .status.fully-paid { background: #28a745 !important; -webkit-print-color-adjust: exact; }
                .status.partially-paid { background: #007bff !important; -webkit-print-color-adjust: exact; }
                .status.not-paid { background: #dc3545 !important; -webkit-print-color-adjust: exact; }
                .items-table th { background: #667eea !important; -webkit-print-color-adjust: exact; }
                .total-item.final { background: #28a745 !important; -webkit-print-color-adjust: exact; }
                .total-item.outstanding { background: #dc3545 !important; -webkit-print-color-adjust: exact; }
              }
              @media (max-width: 768px) {
                body { padding: 10px; }
                .header h1 { font-size: 2em; }
                .header h2 { font-size: 1.2em; }
                .order-info, .items-section, .totals { padding: 20px; }
                .info-grid { grid-template-columns: 1fr; }
                .totals-grid { grid-template-columns: 1fr; }
                .items-table { font-size: 0.9em; }
                .items-table th, .items-table td { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <button class="back-button" onclick="window.close()">← Back</button>
            <div class="print-container">
              <div class="header">
                <h1>Sales Order</h1>
                <h2>${detailedOrder.name}</h2>
              </div>
              
              <div class="order-info">
                <div class="info-grid">
                  <div class="info-item">
                    <strong>Customer:</strong><br>
                    ${detailedOrder.customer_name || detailedOrder.customer}
                  </div>
                  <div class="info-item">
                    <strong>Date:</strong><br>
                    ${new Date(detailedOrder.creation).toLocaleString()}
                  </div>
                  <div class="info-item">
                    <strong>Grand Total:</strong><br>
                    ${currency} ${grandTotal.toFixed(2)}
                  </div>
                  <div class="info-item">
                    <strong>Advance Paid:</strong><br>
                    ${currency} ${advancePaid.toFixed(2)}
                  </div>
                </div>
                
                <div class="status-badges">
                  <span class="status approved">Approved</span>
                  <span class="status ${getPaymentStatus(detailedOrder).includes('Fully Paid') ? 'fully-paid' : 
                                       getPaymentStatus(detailedOrder).includes('Partially Paid') ? 'partially-paid' : 'not-paid'}">
                    ${getPaymentStatus(detailedOrder)}
                  </span>
                </div>
              </div>
              
              <div class="items-section">
                <h3 style="margin-top: 0; color: #495057;">Order Items</h3>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${detailedOrder.items ? detailedOrder.items.map(item => `
                      <tr>
                        <td>${item.item_name}</td>
                        <td>${item.qty || 0}</td>
                        <td>${currency} ${(item.rate || 0).toFixed(2)}</td>
                        <td>${currency} ${((item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
                      </tr>
                    `).join('') : ''}
                  </tbody>
                </table>
              </div>
              
              <div class="totals">
                <div class="totals-grid">
                  <div class="total-item">
                    <strong>Grand Total</strong><br>
                    ${currency} ${grandTotal.toFixed(2)}
                  </div>
                  <div class="total-item">
                    <strong>Advance Paid</strong><br>
                    ${currency} ${advancePaid.toFixed(2)}
                  </div>
                  <div class="total-item ${outstanding > 0 ? 'outstanding' : 'final'}">
                    <strong>Outstanding</strong><br>
                    ${currency} ${outstanding.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        console.log('Print content loaded, opening print dialog...');
        setTimeout(() => {
          printWindow.print();
          // Close window after a delay to allow printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };
      
    } catch (error) {
      console.error('Print error:', error);
      notifications.show({
        title: 'Print Error',
        message: 'Failed to open print dialog. Please try again.',
        color: 'red',
      });
    }
  };

  const handleExportPDF = () => {
    console.log('Starting PDF export...');
    
    if (!detailedOrder) {
      console.error('No order data available for PDF export');
      return;
    }
    
    try {
      // Calculate values to ensure they're properly computed
      const advancePaid = detailedOrder.advance_paid || 0;
      const grandTotal = detailedOrder.grand_total || 0;
      const outstanding = grandTotal - advancePaid;
      
      console.log('PDF Export Calculations:');
      console.log('Advance Paid:', advancePaid);
      console.log('Grand Total:', grandTotal);
      console.log('Outstanding:', outstanding);
      
      // Create a hidden iframe for PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Create the PDF content HTML with back button
      const pdfContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order ${detailedOrder.name}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
                color: #333;
                line-height: 1.6;
              }
              .back-button {
                position: fixed;
                top: 20px;
                left: 20px;
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              }
              .back-button:hover {
                background: #0056b3;
              }
              .print-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              .header { 
                text-align: center; 
                padding: 30px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
              .header h2 { margin: '10px 0 0'; font-size: 1.5em; opacity: 0.9; }
              .order-info { 
                padding: 30px; 
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
              }
              .info-item {
                background: white;
                padding: 15px;
                border-radius: 6px;
                border-left: 4px solid #667eea;
              }
              .info-item strong { color: #495057; }
              .status-badges {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 15px;
              }
              .status { 
                display: inline-block; 
                padding: 6px 12px; 
                border-radius: 20px; 
                color: white; 
                font-weight: 600;
                font-size: 0.9em;
              }
              .status.approved { background: linear-gradient(45deg, #28a745, #20c997); }
              .status.fully-paid { background: linear-gradient(45deg, #28a745, #20c997); }
              .status.partially-paid { background: linear-gradient(45deg, #007bff, #6f42c1); }
              .status.not-paid { background: linear-gradient(45deg, #dc3545, #e83e8c); }
              .items-section {
                padding: 30px;
              }
              .items-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .items-table th { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                text-align: left;
                font-weight: 600;
              }
              .items-table td { 
                padding: 15px;
                border-bottom: 1px solid #e9ecef;
              }
              .items-table tr:hover {
                background: #f8f9fa;
              }
              .totals { 
                padding: 30px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
              }
              .totals-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                max-width: 400px;
                margin-left: auto;
              }
              .total-item {
                background: white;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
                border: 2px solid #e9ecef;
              }
              .total-item.final {
                border-color: #28a745;
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                font-weight: bold;
              }
              .total-item.outstanding {
                border-color: #dc3545;
                background: linear-gradient(135deg, #dc3545, #e83e8c);
                color: white;
                font-weight: bold;
              }
              @media print {
                .back-button { display: none !important; }
                body { margin: 0; padding: 0; }
                .print-container { box-shadow: none; border-radius: 0; }
                .header { background: #667eea !important; -webkit-print-color-adjust: exact; }
                .status.approved, .status.fully-paid { background: #28a745 !important; -webkit-print-color-adjust: exact; }
                .status.partially-paid { background: #007bff !important; -webkit-print-color-adjust: exact; }
                .status.not-paid { background: #dc3545 !important; -webkit-print-color-adjust: exact; }
                .items-table th { background: #667eea !important; -webkit-print-color-adjust: exact; }
                .total-item.final { background: #28a745 !important; -webkit-print-color-adjust: exact; }
                .total-item.outstanding { background: #dc3545 !important; -webkit-print-color-adjust: exact; }
              }
              @media (max-width: 768px) {
                body { padding: 10px; }
                .header h1 { font-size: 2em; }
                .header h2 { font-size: 1.2em; }
                .order-info, .items-section, .totals { padding: 20px; }
                .info-grid { grid-template-columns: 1fr; }
                .totals-grid { grid-template-columns: 1fr; }
                .items-table { font-size: 0.9em; }
                .items-table th, .items-table td { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <button class="back-button" onclick="window.close()">← Back</button>
            <div class="print-container">
              <div class="header">
                <h1>Sales Order</h1>
                <h2>${detailedOrder.name}</h2>
              </div>
              
              <div class="order-info">
                <div class="info-grid">
                  <div class="info-item">
                    <strong>Customer:</strong><br>
                    ${detailedOrder.customer_name || detailedOrder.customer}
                  </div>
                  <div class="info-item">
                    <strong>Date:</strong><br>
                    ${new Date(detailedOrder.creation).toLocaleString()}
                  </div>
                  <div class="info-item">
                    <strong>Grand Total:</strong><br>
                    ${currency} ${grandTotal.toFixed(2)}
                  </div>
                  <div class="info-item">
                    <strong>Advance Paid:</strong><br>
                    ${currency} ${advancePaid.toFixed(2)}
                  </div>
                </div>
                
                <div class="status-badges">
                  <span class="status approved">Approved</span>
                  <span class="status ${getPaymentStatus(detailedOrder).includes('Fully Paid') ? 'fully-paid' : 
                                       getPaymentStatus(detailedOrder).includes('Partially Paid') ? 'partially-paid' : 'not-paid'}">
                    ${getPaymentStatus(detailedOrder)}
                  </span>
                </div>
              </div>
              
              <div class="items-section">
                <h3 style="margin-top: 0; color: #495057;">Order Items</h3>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${detailedOrder.items ? detailedOrder.items.map(item => `
                      <tr>
                        <td>${item.item_name}</td>
                        <td>${item.qty || 0}</td>
                        <td>${currency} ${(item.rate || 0).toFixed(2)}</td>
                        <td>${currency} ${((item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
                      </tr>
                    `).join('') : ''}
                  </tbody>
                </table>
              </div>
              
              <div class="totals">
                <div class="totals-grid">
                  <div class="total-item">
                    <strong>Grand Total</strong><br>
                    ${currency} ${grandTotal.toFixed(2)}
                  </div>
                  <div class="total-item">
                    <strong>Advance Paid</strong><br>
                    ${currency} ${advancePaid.toFixed(2)}
                  </div>
                  <div class="total-item ${outstanding > 0 ? 'outstanding' : 'final'}">
                    <strong>Outstanding</strong><br>
                    ${currency} ${outstanding.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <script>
              // Auto-trigger print dialog after page loads
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `;
      
      // Write content to iframe
      if (iframe.contentDocument) {
        iframe.contentDocument.write(pdfContent);
        iframe.contentDocument.close();
      } else {
        console.error('Could not access iframe contentDocument');
        notifications.show({
          title: 'PDF Export Error',
          message: 'Failed to access iframe content. Please try again.',
          color: 'red',
        });
        return;
      }
      
      // Clean up iframe after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 10000);
      
      notifications.show({
        title: 'PDF Export',
        message: 'PDF export initiated. Use "Save as PDF" in the print dialog.',
        color: 'blue',
      });
      
    } catch (error) {
      console.error('PDF export error:', error);
      notifications.show({
        title: 'PDF Export Error',
        message: 'Failed to export PDF. Please try again.',
        color: 'red',
      });
    }
  };

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      apiService.getSalesOrders(user)
        .then(data => {
          setOrders(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [user]);

  useEffect(() => {
    // Load mode of payments and company name when component mounts
    Promise.all([
      apiService.getModeOfPayments(),
      apiService.getPosProfileDetails('POS')
    ])
    .then(([paymentsData, posProfileData]) => {
      setModeOfPayments(paymentsData);
      setCompanyName(posProfileData.company || 'Your Company');
      console.log('Company name from POS profile:', posProfileData.company);
    })
    .catch(err => {
      console.error('Failed to load initial data:', err);
      // Fallback to default company name
      setCompanyName('Your Company');
    });
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      console.log('OrdersPage: Starting to fetch details for order:', selectedOrder.name);
      setIsDetailLoading(true);
      setDetailedOrder(null); // Clear previous details
      apiService.getSalesOrder(selectedOrder.name)
        .then(data => {
          console.log('OrdersPage: Successfully fetched order details:', data);
          console.log('OrdersPage: Order data structure:', {
            name: data?.name,
            customer: data?.customer,
            customer_name: data?.customer_name,
            docstatus: data?.docstatus,
            grand_total: data?.grand_total,
            outstanding_amount: data?.outstanding_amount,
            items: data?.items,
            hasItems: !!data?.items,
            itemsLength: data?.items?.length
          });
          setDetailedOrder(data);
          setIsDetailLoading(false);
        })
        .catch(err => {
          console.error('OrdersPage: Failed to fetch order details:', err);
          setIsDetailLoading(false);
          // Show error notification
          notifications.show({
            color: 'red',
            title: 'Failed to load order details',
            message: `Could not load details for order ${selectedOrder.name}. Please try again.`,
          });
          // Close the modal to prevent shadow screen
          setSelectedOrder(null);
        });
    }
  }, [selectedOrder]);

  // Debug modal state changes
  useEffect(() => {
    if (selectedOrder) {
      console.log('OrdersPage: Modal state - selectedOrder:', selectedOrder.name, 'isDetailLoading:', isDetailLoading, 'detailedOrder:', detailedOrder ? 'loaded' : 'not loaded');
    }
  }, [selectedOrder, isDetailLoading, detailedOrder]);

  const handleCompletePayment = () => {
    if (detailedOrder) {
      // Calculate remaining amount (grand total - advance paid)
      const remainingAmount = detailedOrder.grand_total - (detailedOrder.advance_paid || 0);
      setPaymentAmount(remainingAmount.toString());
      setShowPaymentForm(true);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!detailedOrder || !paymentAmount || !paymentMethod) {
      notifications.show({
        title: 'Error',
        message: 'Please fill in all payment details',
        color: 'red',
      });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Create payment entry
      const paymentPayload = {
        dt: 'Sales Order',
        dn: detailedOrder.name,
        party_type: 'Customer',
        party: detailedOrder.customer,
        paid_amount: parseFloat(paymentAmount),
        paid_to: paymentMethod === 'Cash' ? 'Cash' : 'Bank',
        mode_of_payment: paymentMethod,
        company: companyName, // Use actual company name from POS profile
        posting_date: new Date().toISOString().split('T')[0],
        // Only include reference fields for non-cash payments
        ...(paymentMethod !== 'Cash' && {
          reference_no: `PAY-${Date.now()}`,
          reference_date: new Date().toISOString().split('T')[0],
        }),
      };

      console.log('Creating payment entry:', paymentPayload);
      console.log('Payment method:', paymentMethod);
      console.log('Is cash payment:', paymentMethod === 'Cash');
      
      // Get company default accounts
      const defaultAccounts = await apiService.getDefaultAccounts(companyName);
      console.log('Default accounts for company:', companyName, defaultAccounts);

      // Create payment entry directly with proper allocation to Sales Order
      const paymentEntryDoc = {
        doctype: 'Payment Entry',
        payment_type: 'Receive',
        party_type: 'Customer',
        party: detailedOrder.customer,
        paid_amount: parseFloat(paymentAmount),
        received_amount: parseFloat(paymentAmount),
        paid_to: paymentMethod === 'Cash' ? defaultAccounts.cash : defaultAccounts.bank,
        paid_to_account: paymentMethod === 'Cash' ? defaultAccounts.cash : defaultAccounts.bank,
        mode_of_payment: paymentMethod,
        company: companyName,
        posting_date: new Date().toISOString().split('T')[0],
        reference_no: paymentMethod !== 'Cash' ? `PAY-${Date.now()}` : undefined,
        reference_date: paymentMethod !== 'Cash' ? new Date().toISOString().split('T')[0] : undefined,
        // Critical: Allocate payment to the specific Sales Order
        references: [{
          reference_doctype: 'Sales Order',
          reference_name: detailedOrder.name,
          allocated_amount: parseFloat(paymentAmount),
          outstanding_amount: parseFloat(paymentAmount) // This ensures proper allocation
        }]
      };

      console.log('Creating payment entry with allocation:', paymentEntryDoc);

      // Save the payment entry
      const savedPayment = await apiService.saveDoc(paymentEntryDoc);
      console.log('Payment entry saved:', savedPayment);

      // Submit the payment entry
      const submittedPayment = await apiService.submitDoc(savedPayment);
      console.log('Payment entry submitted:', submittedPayment);

      // Update the Sales Order to reflect the payment
      console.log('Updating Sales Order status...');
      try {
        // Get the updated Sales Order to check outstanding amount
        const updatedOrder = await apiService.getSalesOrder(detailedOrder.name);
        console.log('Updated order outstanding amount:', updatedOrder.outstanding_amount);
        
        // If outstanding amount is 0, update the order status
        if (updatedOrder.outstanding_amount === 0) {
          console.log('Order is fully paid, updating status...');
          // You might want to add a custom field or update the order status here
          // This depends on your ERPNext configuration
        }
      } catch (updateError) {
        console.warn('Could not update order status:', updateError);
        // Don't fail the payment if status update fails
      }

      notifications.show({
        title: 'Success',
        message: `Payment of ${currency} ${paymentAmount} collected successfully!`,
        color: 'green',
      });

      // Close the payment form and refresh orders
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentMethod('');
      
      // Refresh the current order details to show updated status
      console.log('Refreshing order details...');
      const refreshedOrder = await apiService.getSalesOrder(detailedOrder.name);
      setDetailedOrder(refreshedOrder);
      console.log('Refreshed order outstanding amount:', refreshedOrder.outstanding_amount);
      
      // Refresh the orders list
      if (user) {
        const updatedOrders = await apiService.getSalesOrders(user);
        setOrders(updatedOrders);
      }

    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to process payment. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('ValidationError')) {
          errorMessage = 'Payment validation failed. Please check your payment details.';
        } else if (error.message.includes('Reference No')) {
          errorMessage = 'Reference number is required for this payment method.';
        } else {
          errorMessage = error.message;
        }
      }
      
      notifications.show({
        title: 'Payment Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setPaymentAmount('');
    setPaymentMethod('');
  };

  const getStatusText = (status: number) => {
    if (status === 0) return 'Pending Approval';
    if (status === 1) return 'Approved';
    if (status === 2) return 'Cancelled';
    return 'Unknown';
  };

  const getPaymentStatus = (order: any) => {
    // ERPNext uses 'advance_paid' field for tracking payments
    const advancePaid = order.advance_paid || 0;
    const grandTotal = order.grand_total || 0;
    
    if (advancePaid >= grandTotal) {
      return '✅ Fully Paid';
    } else if (advancePaid > 0) {
      return `💰 Partially Paid (${currency} ${advancePaid.toFixed(2)} paid)`;
    } else {
      return '❌ Not Paid';
    }
  };


  const getOrderStatusBadges = (order: any) => {
    const badges = [];
    
    // Document status badge
    if (order.docstatus === 0) {
      badges.push({ text: 'PENDING APPROVAL', color: 'yellow' });
    } else if (order.docstatus === 1) {
      badges.push({ text: 'APPROVED', color: 'green' });
    } else if (order.docstatus === 2) {
      badges.push({ text: 'CANCELLED', color: 'red' });
    }
    
    // Payment status badge
    if (order.docstatus === 1) { // Only show payment status for approved orders
      const advancePaid = order.advance_paid || 0;
      const grandTotal = order.grand_total || 0;
      
      if (advancePaid >= grandTotal) {
        badges.push({ text: 'FULLY PAID', color: 'green' });
      } else if (advancePaid > 0) {
        badges.push({ text: 'PARTIALLY PAID', color: 'blue' });
      } else {
        badges.push({ text: 'PAYMENT READY', color: 'blue' });
      }
    }
    
    return badges;
  };

  const filteredOrders = orders
    .filter(order => {
      if (!customerFilter) return true;
      return order.customer_name?.toLowerCase().includes(customerFilter.toLowerCase()) ||
             order.customer.toLowerCase().includes(customerFilter.toLowerCase());
    })
    .filter(order => {
      if (!dateFilter) return true;
      const orderDate = new Date(order.creation);
      return orderDate.toDateString() === dateFilter.toDateString();
    })
    .sort((a, b) => new Date(b.creation).getTime() - new Date(a.creation).getTime());

  const renderContent = () => {
    if (isLoading) {
      return (
        <Center style={{ height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <Text mt="md" c="dimmed">Loading your orders...</Text>
          </div>
        </Center>
      );
    }
    if (filteredOrders.length === 0) {
      return (
        <Center style={{ height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" c="dimmed" mb="md">📋</Text>
            <Text size="lg" fw={500} mb="xs">No orders found</Text>
            <Text size="sm" c="dimmed">Try adjusting your filters or create a new order</Text>
          </div>
        </Center>
      );
    }
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={{ base: 'md', sm: 'lg' }} style={{ margin: '0.06rem', padding: '0.06rem' }}>
        {filteredOrders.map((order: SalesOrder) => (
          <Card 
            key={order.name} 
            onClick={() => setSelectedOrder(order)} 
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            {/* Header with gradient background */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              margin: '-16px -16px 16px -16px',
              padding: '16px',
              color: 'white',
              position: 'relative',
            }}>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="lg" c="white">{order.name}</Text>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {new Date(order.creation).toLocaleDateString()}
                </div>
              </Group>
              
              {/* Status badges */}
              <Group gap="xs" mb="xs">
                {getOrderStatusBadges(order).map((badge, index) => (
                  <Badge 
                    key={index}
                    color={badge.color === 'yellow' ? 'yellow' : 
                           badge.color === 'green' ? 'green' : 
                           badge.color === 'blue' ? 'blue' :
                           badge.color === 'red' ? 'red' : 'gray'}
                    leftSection={badge.text.includes('PAID') ? <IconCreditCard size={12} /> : undefined}
                    style={{
                      background: badge.color === 'yellow' ? '#ffc107' : 
                                 badge.color === 'green' ? '#28a745' : 
                                 badge.color === 'blue' ? '#007bff' :
                                 badge.color === 'red' ? '#dc3545' : '#6c757d',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '11px',
                      borderRadius: '12px',
                      padding: '4px 8px'
                    }}
                  >
                    {badge.text}
              </Badge>
                ))}
            </Group>
            </div>

            {/* Customer info */}
            <div style={{ marginBottom: '16px' }}>
              <Text size="sm" c="dimmed" mb="xs" style={{ fontWeight: '500' }}>Customer</Text>
              <Text size="md" fw={500} style={{ color: '#495057' }}>
                {order.customer_name || order.customer}
              </Text>
            </div>

            {/* Payment info */}
            <div style={{ marginBottom: '16px' }}>
              <Text size="sm" c="dimmed" mb="xs" style={{ fontWeight: '500' }}>Payment Status</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: order.advance_paid && order.advance_paid > 0 ? 
                    (order.advance_paid >= order.grand_total ? '#28a745' : '#ffc107') : '#dc3545'
                }}></div>
                <Text size="sm" fw={500}>
                  {order.advance_paid && order.advance_paid > 0 ? 
                    (order.advance_paid >= order.grand_total ? 'Fully Paid' : 'Partially Paid') : 
                    'Not Paid'}
                </Text>
              </div>
            </div>

            {/* Amount section */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #e9ecef'
            }}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed" style={{ fontWeight: '500' }}>Grand Total</Text>
                <Text size="lg" fw={700} style={{ 
                  color: '#495057',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {currency} {order.grand_total.toFixed(2)}
                </Text>
            </Group>
              
              {order.advance_paid && order.advance_paid > 0 && (
                <Group justify="space-between" mt="xs">
                  <Text size="xs" c="dimmed">Advance Paid</Text>
                  <Text size="sm" fw={500} c="green">
                    {currency} {order.advance_paid.toFixed(2)}
                  </Text>
                </Group>
              )}
              
              {(order.grand_total - (order.advance_paid || 0)) > 0 && (
                <Group justify="space-between" mt="xs">
                  <Text size="xs" c="dimmed">Outstanding</Text>
                  <Text size="sm" fw={500} c="red">
                    {currency} {(order.grand_total - (order.advance_paid || 0)).toFixed(2)}
                  </Text>
                </Group>
              )}
            </div>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <>
    <div style={{
      background: '#f8f9fa',
      minHeight: '100vh',
      padding: '0',
      width: '100%',
      margin: 0
    }}>
      {/* Modern Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        width: '100%',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <Title order={1} c="white" mb="xs" style={{ fontSize: '2rem', fontWeight: '700' }}>
              📋 My Orders
            </Title>
            <Text size="lg" c="rgba(255,255,255,0.8)" style={{ fontWeight: '400' }}>
              Manage and track your sales orders
            </Text>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <Text size="sm" c="white" fw={500}>Total Orders</Text>
            <Text size="xl" c="white" fw={700}>{orders.length}</Text>
          </div>
        </div>
        
        {/* Modern Filter Section */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <Group grow>
        <TextInput
              placeholder="🔍 Search by customer name..."
              leftSection={<IconSearch style={{ width: rem(18), height: rem(18) }} />}
          value={customerFilter}
          onChange={(event) => setCustomerFilter(event.currentTarget.value)}
              styles={{
                input: {
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  '&:focus': {
                    background: 'white',
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.3)'
                  }
                }
              }}
        />
        <TextInput
          type="date"
              placeholder="📅 Filter by date"
          value={dateFilter ? dateFilter.toISOString().split('T')[0] : ''}
          onChange={(event) => setDateFilter(event.currentTarget.value ? new Date(event.currentTarget.value) : null)}
              styles={{
                input: {
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  '&:focus': {
                    background: 'white',
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.3)'
                  }
                }
              }}
        />
      </Group>
        </div>
      </div>
      
      {/* Content Area */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        minHeight: '60vh'
      }}>
      {renderContent()}
      </div>

      {/* Modern Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            color: 'black',
            position: 'relative',
            zIndex: 1001,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px 24px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <Text size="xl" fw={700} c="white" mb="xs">
                  📄 Order Details
                </Text>
                <Text size="sm" c="rgba(255,255,255,0.8)">
                  {selectedOrder.name}
                </Text>
              </div>
              <button
                onClick={() => {
          setSelectedOrder(null);
          setDetailedOrder(null);
                  setShowPaymentForm(false);
                  setShowPrintPreview(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Modal Content */}
            <div style={{ 
              padding: '24px',
              overflow: 'auto',
              flex: 1,
              background: '#f8f9fa'
            }}>
            
            {isDetailLoading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'white',
                borderRadius: '12px',
                margin: '20px 0'
              }}>
                <Loader size="lg" />
                <Text mt="md" c="dimmed" size="lg">Loading order details...</Text>
              </div>
            )}

          {!isDetailLoading && detailedOrder && (
              <div>
                {/* Order Summary Cards */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {/* Customer Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    <Text size="sm" c="rgba(255,255,255,0.8)" mb="xs" fw={500}>Customer</Text>
                    <Text size="lg" fw={600} c="white">
                      {detailedOrder.customer_name || detailedOrder.customer}
                    </Text>
                  </div>

                  {/* Status Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    <Text size="sm" c="rgba(255,255,255,0.8)" mb="xs" fw={500}>Status</Text>
                    <Text size="lg" fw={600} c="white">
                      {getStatusText(detailedOrder.docstatus)}
                    </Text>
                  </div>

                  {/* Payment Status Card */}
                  <div style={{
                    background: detailedOrder.advance_paid && detailedOrder.advance_paid > 0 ? 
                      (detailedOrder.advance_paid >= detailedOrder.grand_total ? 
                        'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 
                        'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)') :
                      'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    <Text size="sm" c="rgba(255,255,255,0.8)" mb="xs" fw={500}>Payment Status</Text>
                    <Text size="lg" fw={600} c="white">
                      {getPaymentStatus(detailedOrder)}
                    </Text>
                  </div>

                  {/* Date Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    <Text size="sm" c="rgba(255,255,255,0.8)" mb="xs" fw={500}>Order Date</Text>
                    <Text size="lg" fw={600} c="white">
                      {new Date(detailedOrder.creation).toLocaleDateString()}
                    </Text>
                    <Text size="xs" c="rgba(255,255,255,0.7)">
                      {new Date(detailedOrder.creation).toLocaleTimeString()}
                    </Text>
                  </div>
                </div>

                {/* Financial Summary */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  border: '1px solid #e9ecef'
                }}>
                  <Text size="lg" fw={600} mb="md" style={{ color: '#495057' }}>💰 Financial Summary</Text>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px'
                  }}>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <Text size="sm" c="dimmed" mb="xs">Grand Total</Text>
                      <Text size="xl" fw={700} style={{ 
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        {currency} {detailedOrder.grand_total.toFixed(2)}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <Text size="sm" c="dimmed" mb="xs">Advance Paid</Text>
                      <Text size="xl" fw={700} c="green">
                        {currency} {(detailedOrder.advance_paid || 0).toFixed(2)}
                      </Text>
                    </div>
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '16px', 
                      background: (detailedOrder.grand_total - (detailedOrder.advance_paid || 0)) > 0 ? '#fff5f5' : '#f0fff4',
                      borderRadius: '8px',
                      border: (detailedOrder.grand_total - (detailedOrder.advance_paid || 0)) > 0 ? '1px solid #fed7d7' : '1px solid #c6f6d5'
                    }}>
                      <Text size="sm" c="dimmed" mb="xs">Outstanding</Text>
                      <Text size="xl" fw={700} c={(detailedOrder.grand_total - (detailedOrder.advance_paid || 0)) > 0 ? 'red' : 'green'}>
                        {currency} {(detailedOrder.grand_total - (detailedOrder.advance_paid || 0)).toFixed(2)}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                {detailedOrder.items && detailedOrder.items.length > 0 && (
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid #e9ecef'
                  }}>
                    <Text size="lg" fw={600} mb="md" style={{ color: '#495057' }}>📦 Order Items</Text>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <thead>
                          <tr style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                          }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Item</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Qty</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600' }}>Rate</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedOrder.items.map((item, index) => (
                            <tr key={item.item_code} style={{ 
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                              transition: 'background-color 0.2s ease'
                            }}>
                              <td style={{ padding: '16px', fontWeight: '500', color: '#495057' }}>
                                {item.item_name}
                              </td>
                              <td style={{ padding: '16px', textAlign: 'center', fontWeight: '500' }}>
                                {item.qty || 0}
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>
                                {currency} {(item.rate || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>
                                {currency} {((item.qty || 0) * (item.rate || 0)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!showPaymentForm ? (
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    justifyContent: 'flex-end',
                    marginTop: '24px',
                    padding: '20px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid #e9ecef'
                  }}>
                    <button 
                      onClick={handlePrintPreview}
                      style={{ 
                        padding: '12px 24px', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      🖨️ Print Preview
                    </button>
                    {detailedOrder.docstatus === 1 && (detailedOrder.grand_total - (detailedOrder.advance_paid || 0)) > 0 && (
                      <button 
                        onClick={handleCompletePayment}
                        style={{ 
                          padding: '12px 24px', 
                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                        }}
                      >
                        💳 Collect Payment
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    marginTop: '24px', 
                    padding: '24px', 
                    background: 'white', 
                    borderRadius: '12px', 
                    border: '1px solid #e9ecef',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: '2px solid #e9ecef'
                    }}>
                      <Text size="lg" fw={600} style={{ color: '#495057' }}>💳 Collect Payment</Text>
                    </div>
                    
                    {/* Payment Summary */}
                    <div style={{
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '20px',
                      border: '1px solid #e9ecef'
                    }}>
                      <Text size="sm" fw={600} mb="xs" style={{ color: '#495057' }}>Payment Summary</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <Text size="xs" c="dimmed">Already Paid</Text>
                          <Text size="sm" fw={500} c="green">
                            {currency} {(detailedOrder.advance_paid || 0).toFixed(2)}
                          </Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed">Remaining</Text>
                          <Text size="sm" fw={500} c="red">
                            {currency} {(detailedOrder.grand_total - (detailedOrder.advance_paid || 0)).toFixed(2)}
                          </Text>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <Text size="sm" fw={600} mb="xs" style={{ color: '#495057' }}>
                        Payment Amount ({currency})
                      </Text>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '12px 16px', 
                          border: '2px solid #e9ecef', 
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          background: 'white'
                        }}
                        placeholder="Enter payment amount"
                        step="0.01"
                        min="0"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e9ecef';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <Text size="sm" fw={600} mb="xs" style={{ color: '#495057' }}>
                        Payment Method
                      </Text>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '12px 16px', 
                          border: '2px solid #e9ecef', 
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e9ecef';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">Select payment method</option>
                        {modeOfPayments.map(method => (
                          <option key={method.name} value={method.name}>
                            {method.mode_of_payment || method.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Form Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      justifyContent: 'flex-end',
                      marginTop: '24px',
                      paddingTop: '20px',
                      borderTop: '2px solid #e9ecef'
                    }}>
                      <button 
                        onClick={handleCancelPayment}
                        disabled={isProcessingPayment}
                        style={{ 
                          padding: '12px 24px', 
                          background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          opacity: isProcessingPayment ? 0.6 : 1,
                          boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isProcessingPayment) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isProcessingPayment) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.3)';
                          }
                        }}
                      >
                        ❌ Cancel
                      </button>
                      <button 
                        onClick={handlePaymentSubmit}
                        disabled={isProcessingPayment || !paymentAmount || !paymentMethod}
                        style={{ 
                          padding: '12px 24px', 
                          background: isProcessingPayment || !paymentAmount || !paymentMethod ? 
                            'linear-gradient(135deg, #adb5bd 0%, #6c757d 100%)' : 
                            'linear-gradient(135deg, #28a745 0%, #20c997 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: isProcessingPayment || !paymentAmount || !paymentMethod ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          opacity: isProcessingPayment || !paymentAmount || !paymentMethod ? 0.6 : 1,
                          boxShadow: isProcessingPayment || !paymentAmount || !paymentMethod ? 
                            '0 4px 15px rgba(173, 181, 189, 0.3)' : 
                            '0 4px 15px rgba(40, 167, 69, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isProcessingPayment && paymentAmount && paymentMethod) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isProcessingPayment && paymentAmount && paymentMethod) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                          }
                        }}
                      >
                        {isProcessingPayment ? '⏳ Processing...' : '✅ Process Payment'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isDetailLoading && !detailedOrder && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                ❌ No order details available
      </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && detailedOrder && (() => {
        // Calculate values to ensure they're properly computed
        const advancePaid = detailedOrder.advance_paid || 0;
        const grandTotal = detailedOrder.grand_total || 0;
        const outstanding = grandTotal - advancePaid;
        
        console.log('Print Preview Calculations:');
        console.log('Advance Paid:', advancePaid);
        console.log('Grand Total:', grandTotal);
        console.log('Outstanding:', outstanding);
        
        return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modern Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px 24px',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => setShowPrintPreview(false)}
                  style={{ 
                    padding: '10px 16px', 
                    background: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  }}
                >
                  ← Back
                </button>
                <Text size="lg" fw={600} c="white">
                  🖨️ Print Preview - {detailedOrder.name}
                </Text>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={printOrientation}
                  onChange={(e) => setPrintOrientation(e.target.value as 'portrait' | 'landscape')}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ced4da' }}
                  title="Print Orientation"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
                <select 
                  value={printScale}
                  onChange={(e) => setPrintScale(parseFloat(e.target.value))}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ced4da' }}
                  title="Print Scale"
                >
                  <option value={0.5}>50%</option>
                  <option value={0.75}>75%</option>
                  <option value={1}>100%</option>
                  <option value={1.25}>125%</option>
                  <option value={1.5}>150%</option>
                </select>
                <button 
                  onClick={() => setShowPrintPreview(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transform: `scale(${printScale})`,
                transformOrigin: 'top center',
                margin: '0 auto',
                maxWidth: printOrientation === 'landscape' ? '1000px' : '800px',
                minHeight: printOrientation === 'landscape' ? '600px' : '800px'
              }}>
                {/* Print Content */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textAlign: 'center',
                  padding: '30px 20px'
                }}>
                  <h1 style={{ margin: 0, fontSize: '2.5em', fontWeight: 300 }}>Sales Order</h1>
                  <h2 style={{ margin: '10px 0 0', fontSize: '1.5em', opacity: 0.9 }}>{detailedOrder.name}</h2>
                </div>
                
                <div style={{ padding: '30px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                  {/* Debug Info */}
                  <div style={{ 
                    background: '#fff3cd', 
                    border: '1px solid #ffeaa7', 
                    borderRadius: '4px', 
                    padding: '10px', 
                    marginBottom: '20px',
                    fontSize: '12px',
                    color: '#856404'
                  }}>
                    <strong>Debug Info:</strong><br />
                    Advance Paid Raw: {JSON.stringify(detailedOrder.advance_paid)}<br />
                    Advance Paid Calculated: {advancePaid}<br />
                    Grand Total: {grandTotal}<br />
                    Outstanding Calculated: {outstanding}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #667eea' }}>
                      <strong style={{ color: '#495057' }}>Customer:</strong><br />
                      {detailedOrder.customer_name || detailedOrder.customer}
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #667eea' }}>
                      <strong style={{ color: '#495057' }}>Date:</strong><br />
                      {new Date(detailedOrder.creation).toLocaleString()}
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #667eea' }}>
                      <strong style={{ color: '#495057' }}>Grand Total:</strong><br />
                      {currency} {grandTotal.toFixed(2)}
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #667eea' }}>
                      <strong style={{ color: '#495057' }}>Advance Paid:</strong><br />
                      {currency} {advancePaid.toFixed(2)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9em',
                      background: 'linear-gradient(45deg, #28a745, #20c997)'
                    }}>
                      Approved
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9em',
                      background: getPaymentStatus(detailedOrder).includes('Fully Paid') ? 
                        'linear-gradient(45deg, #28a745, #20c997)' :
                        getPaymentStatus(detailedOrder).includes('Partially Paid') ? 
                        'linear-gradient(45deg, #007bff, #6f42c1)' :
                        'linear-gradient(45deg, #dc3545, #e83e8c)'
                    }}>
                      {getPaymentStatus(detailedOrder)}
                    </span>
                  </div>
                </div>
                
                <div style={{ padding: '30px' }}>
                  <h3 style={{ marginTop: 0, color: '#495057' }}>Order Items</h3>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    margin: '20px 0',
                    background: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '15px',
                          textAlign: 'left',
                          fontWeight: 600
                        }}>Item</th>
                        <th style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '15px',
                          textAlign: 'left',
                          fontWeight: 600
                        }}>Quantity</th>
                        <th style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '15px',
                          textAlign: 'left',
                          fontWeight: 600
                        }}>Rate</th>
                        <th style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '15px',
                          textAlign: 'left',
                          fontWeight: 600
                        }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedOrder.items ? detailedOrder.items.map((item: any, index: number) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                          <td style={{ padding: '15px' }}>{item.item_name}</td>
                          <td style={{ padding: '15px' }}>{item.qty || 0}</td>
                          <td style={{ padding: '15px' }}>{currency} {(item.rate || 0).toFixed(2)}</td>
                          <td style={{ padding: '15px' }}>{currency} {((item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                </div>
                
                <div style={{ padding: '30px', background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
                  {/* Debug Info for Totals */}
                  <div style={{ 
                    background: '#d1ecf1', 
                    border: '1px solid #bee5eb', 
                    borderRadius: '4px', 
                    padding: '10px', 
                    marginBottom: '20px',
                    fontSize: '12px',
                    color: '#0c5460'
                  }}>
                    <strong>Totals Debug:</strong><br />
                    Advance Paid Raw: {JSON.stringify(detailedOrder.advance_paid)}<br />
                    Advance Paid Calculated: {advancePaid}<br />
                    Grand Total: {grandTotal}<br />
                    Outstanding Calculated: {outstanding}<br />
                    Calculation: {grandTotal} - {advancePaid} = {outstanding}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    maxWidth: '400px',
                    marginLeft: 'auto'
                  }}>
                    <div style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '2px solid #e9ecef'
                    }}>
                      <strong>Grand Total</strong><br />
                      {currency} {grandTotal.toFixed(2)}
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '2px solid #e9ecef'
                    }}>
                      <strong>Advance Paid</strong><br />
                      {currency} {advancePaid.toFixed(2)}
                    </div>
                    <div style={{
                      background: outstanding > 0 ? 
                        'linear-gradient(135deg, #dc3545, #e83e8c)' : 
                        'linear-gradient(135deg, #28a745, #20c997)',
                      color: 'white',
                      padding: '15px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '2px solid ' + (outstanding > 0 ? '#dc3545' : '#28a745')
                    }}>
                      <strong>Outstanding</strong><br />
                      {currency} {outstanding.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ color: '#6c757d', fontSize: '0.9em' }}>
                Preview shows how the document will look when printed
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setShowPrintPreview(false)}
                  style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowPrintPreview(false);
                    handleExportPDF();
                  }}
                  style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  📄 Export PDF
                </button>
                <button 
                  onClick={() => {
                    setShowPrintPreview(false);
                    handlePrint();
                  }}
                  style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🖨️ Print Now
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
      </div>
    </>
  );
}
