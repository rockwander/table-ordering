'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Dashboard
    'dashboard.title': "Ramani's Cafe Admin",
    'dashboard.orders': 'Orders',
    'dashboard.todayOrders': "Today's Orders",
    'dashboard.todayRevenue': "Today's Revenue",
    'dashboard.pendingOrders': 'Pending Orders',
    'dashboard.pendingBills': 'Pending Bills',
    'dashboard.settledBills': 'Settled Bills',
    'dashboard.unsettledBills': 'Unsettled Bills',

    // Order Status
    'status.pending': 'Pending',
    'status.confirmed': 'Confirmed',
    'status.preparing': 'Preparing',
    'status.ready': 'Ready',
    'status.served': 'Served',
    'status.billRequested': 'Bill Requested',
    'status.paid': 'Paid',
    'status.cancelled': 'Cancelled',

    // Actions
    'actions.settle': 'Settle Bill',
    'actions.settling': 'Settling...',
    'actions.print': 'Print Bill',
    'actions.delete': 'Delete',
    'actions.cancel': 'Cancel',
    'actions.confirm': 'Confirm',

    // Table
    'table.number': 'Table',
    'table.time': 'Time',
    'table.items': 'Items',
    'table.total': 'Total',
    'table.status': 'Status',

    // Bill
    'bill.id': 'Bill ID',
    'bill.subtotal': 'Subtotal',
    'bill.tax': 'Tax',
    'bill.total': 'Total',
    'bill.settledAt': 'Settled At',

    // Notifications
    'notif.newOrder': 'New Order',
    'notif.waiterCalled': 'Waiter Called',
    'notif.itemsOrdered': 'item(s) ordered',
    'notif.customerNeeds': 'Customer needs assistance',

    // Common
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    'common.refresh': 'Refresh',
    'common.language': 'Language',

    // Live Orders
    'liveOrders.title': 'Live Orders',
    'liveOrders.subtitle': 'Real-time order management and billing',
    'liveOrders.newOrders': 'New Orders',
    'liveOrders.settleBill': 'Settle Bill',
    'liveOrders.pastBills': 'Past Bills',
    'liveOrders.noNewOrders': 'No new orders',
    'liveOrders.noBillsToSettle': 'No bills to settle',
    'liveOrders.noPastBills': 'No past bills',
    'liveOrders.markAsReady': 'Mark as Ready',
    'liveOrders.marking': 'Marking...',
    'liveOrders.order': 'Order',
    'liveOrders.orders': 'orders',
    'liveOrders.item': 'Item',
    'liveOrders.qty': 'Qty',
    'liveOrders.price': 'Price',
    'liveOrders.note': 'Note',
    'liveOrders.billSummary': 'Bill Summary',
    'liveOrders.appDiscount': 'App Discount (10%)',
    'liveOrders.finalAmount': 'Final Amount',

    // Admin Order
    'adminOrder.createOrder': 'Create Order',
    'adminOrder.adminOrder': 'Admin Order',
    'adminOrder.orderItems': 'Order Items',
    'adminOrder.noItems': 'No items added yet',
    'adminOrder.specialInstructions': 'Special instructions (optional)',

    // Order Edit
    'orderEdit.editOrder': 'Edit Order',
    'orderEdit.items': 'Order Items',
    'orderEdit.noItems': 'No items in order',
    'orderEdit.specialInstructions': 'Special instructions',
    'orderEdit.addItems': 'Add Items',
    'orderEdit.searchItems': 'Search items...',
    'orderEdit.hideMenu': 'Hide Menu',
    'orderEdit.discounts': 'Discounts',
    'orderEdit.removeAppDiscount': 'Remove 10% App Discount',
    'orderEdit.customDiscount': 'Custom Discount Amount',
    'orderEdit.summary': 'Summary',
    'orderEdit.saveChanges': 'Save Changes',

    // Common
    'common.cancel': 'Cancel',
  },
  gu: {
    // Dashboard
    'dashboard.title': 'રમણીઝ કૅફે એડમિન',
    'dashboard.orders': 'ઓર્ડર્સ',
    'dashboard.todayOrders': 'આજના ઓર્ડર્સ',
    'dashboard.todayRevenue': 'આજની આવક',
    'dashboard.pendingOrders': 'બાકી ઓર્ડર્સ',
    'dashboard.pendingBills': 'બાકી બિલ્સ',
    'dashboard.settledBills': 'ચૂકવેલા બિલ્સ',
    'dashboard.unsettledBills': 'બાકી બિલ્સ',

    // Order Status
    'status.pending': 'બાકી',
    'status.confirmed': 'કન્ફર્મ',
    'status.preparing': 'તૈયાર થઈ રહ્યું છે',
    'status.ready': 'તૈયાર',
    'status.served': 'પીરસાયેલ',
    'status.billRequested': 'બિલ માગ્યું',
    'status.paid': 'ચૂકવાયેલ',
    'status.cancelled': 'રદ',

    // Actions
    'actions.settle': 'બિલ ચૂકવો',
    'actions.settling': 'ચૂકવી રહ્યા છીએ...',
    'actions.print': 'બિલ છાપો',
    'actions.delete': 'કાઢી નાખો',
    'actions.cancel': 'રદ કરો',
    'actions.confirm': 'કન્ફર્મ કરો',

    // Table
    'table.number': 'ટેબલ',
    'table.time': 'સમય',
    'table.items': 'વસ્તુઓ',
    'table.total': 'કુલ',
    'table.status': 'સ્ટેટસ',

    // Bill
    'bill.id': 'બિલ આઈડી',
    'bill.subtotal': 'સબટોટલ',
    'bill.tax': 'ટેક્સ',
    'bill.total': 'કુલ',
    'bill.settledAt': 'ચૂકવ્યાનો સમય',

    // Notifications
    'notif.newOrder': 'નવો ઓર્ડર',
    'notif.waiterCalled': 'વેઈટર બોલાવ્યો',
    'notif.itemsOrdered': 'વસ્તુઓ ઓર્ડર કરી',
    'notif.customerNeeds': 'ગ્રાહકને મદદ જોઈએ છે',

    // Common
    'common.loading': 'લોડ થઈ રહ્યું છે...',
    'common.noData': 'કોઈ ડેટા નથી',
    'common.refresh': 'રિફ્રેશ',
    'common.language': 'ભાષા',

    // Live Orders
    'liveOrders.title': 'લાઈવ ઓર્ડર્સ',
    'liveOrders.subtitle': 'રિયલ-ટાઈમ ઓર્ડર મેનેજમેન્ટ અને બિલિંગ',
    'liveOrders.newOrders': 'નવા ઓર્ડર્સ',
    'liveOrders.settleBill': 'બિલ ચૂકવો',
    'liveOrders.pastBills': 'પાછલા બિલ્સ',
    'liveOrders.noNewOrders': 'કોઈ નવા ઓર્ડર્સ નથી',
    'liveOrders.noBillsToSettle': 'ચૂકવવા માટે કોઈ બિલ્સ નથી',
    'liveOrders.noPastBills': 'કોઈ પાછલા બિલ્સ નથી',
    'liveOrders.markAsReady': 'તૈયાર તરીકે માર્ક કરો',
    'liveOrders.marking': 'માર્ક કરી રહ્યા છીએ...',
    'liveOrders.order': 'ઓર્ડર',
    'liveOrders.orders': 'ઓર્ડર્સ',
    'liveOrders.item': 'વસ્તુ',
    'liveOrders.qty': 'જથ્થો',
    'liveOrders.price': 'કિંમત',
    'liveOrders.note': 'નોંધ',
    'liveOrders.billSummary': 'બિલ સારાંશ',
    'liveOrders.appDiscount': 'એપ ડિસ્કાઉન્ટ (10%)',
    'liveOrders.finalAmount': 'અંતિમ રકમ',

    // Admin Order
    'adminOrder.createOrder': 'ઓર્ડર બનાવો',
    'adminOrder.adminOrder': 'એડમિન ઓર્ડર',
    'adminOrder.orderItems': 'ઓર્ડર વસ્તુઓ',
    'adminOrder.noItems': 'હજી સુધી કોઈ વસ્તુઓ ઉમેરાયેલ નથી',
    'adminOrder.specialInstructions': 'વિશેષ સૂચનાઓ (વૈકલ્પિક)',

    // Order Edit
    'orderEdit.editOrder': 'ઓર્ડર એડિટ કરો',
    'orderEdit.items': 'ઓર્ડર વસ્તુઓ',
    'orderEdit.noItems': 'ઓર્ડરમાં કોઈ વસ્તુઓ નથી',
    'orderEdit.specialInstructions': 'વિશેષ સૂચનાઓ',
    'orderEdit.addItems': 'વસ્તુઓ ઉમેરો',
    'orderEdit.searchItems': 'વસ્તુઓ શોધો...',
    'orderEdit.hideMenu': 'મેનુ છુપાવો',
    'orderEdit.discounts': 'ડિસ્કાઉન્ટ',
    'orderEdit.removeAppDiscount': '10% એપ ડિસ્કાઉન્ટ દૂર કરો',
    'orderEdit.customDiscount': 'કસ્ટમ ડિસ્કાઉન્ટ રકમ',
    'orderEdit.summary': 'સારાંશ',
    'orderEdit.saveChanges': 'ફેરફારો સાચવો',

    // Common
    'common.cancel': 'રદ કરો',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'gu')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
