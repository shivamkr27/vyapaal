import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Order, Rate, Inventory, User, OrderItem } from '../../types';

interface OrderFormProps {
  user: User;
  order?: Order | null;
  rates: Rate[];
  inventory: Inventory[];
  onSave: (order: Omit<Order, 'id' | 'userId' | 'createdAt'>) => void;
  onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ user, order, rates, inventory, onSave, onCancel }) => {
  const [customerInfo, setCustomerInfo] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    status: 'pending' as 'pending' | 'delivered',
    deliveryDate: new Date().toISOString().split('T')[0],
    paid: 0,
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { item: '', category: '', quantity: 0, rate: 0, amount: 0 }
  ]);

  const [errors, setErrors] = useState<{
    customer: Record<string, string>,
    items: Record<string, string>[]
  }>({
    customer: {},
    items: [{}]
  });

  const [availableCategories, setAvailableCategories] = useState<string[][]>([[]]);

  useEffect(() => {
    if (order) {
      setCustomerInfo({
        customerId: order.customerId || '',
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        status: order.status,
        deliveryDate: order.deliveryDate,
        paid: order.paid,
      });

      // If the order has items array, use it
      if (order.items && order.items.length > 0) {
        setOrderItems(order.items);

        // Initialize available categories for each item
        const categories = order.items.map(item => {
          return inventory
            .filter(inv => inv.item === item.item)
            .map(inv => inv.category);
        });
        setAvailableCategories(categories);
        setErrors({
          customer: {},
          items: order.items.map(() => ({}))
        });
      } else {
        // Otherwise use the legacy single item format
        setOrderItems([{
          item: order.item,
          category: order.category,
          quantity: order.quantity,
          rate: order.rate,
          amount: order.totalAmount
        }]);

        const categories = [inventory
          .filter(inv => inv.item === order.item)
          .map(inv => inv.category)];
        setAvailableCategories(categories);
        setErrors({
          customer: {},
          items: [{}]
        });
      }
    }
  }, [order, inventory]);

  // Update available categories when an item is selected
  useEffect(() => {
    const newAvailableCategories = orderItems.map(item => {
      if (!item.item) return [];
      return inventory
        .filter(inv => inv.item === item.item)
        .map(inv => inv.category);
    });
    setAvailableCategories(newAvailableCategories);
  }, [orderItems, inventory]);

  // Update rates when item or category changes
  useEffect(() => {
    const updatedItems = orderItems.map((item, index) => {
      if (item.item && item.category) {
        const rateData = rates.find(r => r.item === item.item && r.category === item.category);
        if (rateData) {
          return { ...item, rate: rateData.rate, amount: item.quantity * rateData.rate };
        }
      }
      return item;
    });
    setOrderItems(updatedItems);
  }, [orderItems.map(item => item.item + item.category).join(','), rates]);

  // Calculate total amount
  const totalAmount = orderItems.reduce((sum, item) => sum + item.amount, 0);
  const due = Math.max(0, totalAmount - customerInfo.paid);

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: name === 'paid' ? parseFloat(value) || 0 : value
    }));

    if (errors.customer[name]) {
      setErrors(prev => ({
        ...prev,
        customer: { ...prev.customer, [name]: '' }
      }));
    }
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newItems = [...orderItems];

    if (name === 'quantity' || name === 'rate') {
      const numValue = parseFloat(value) || 0;
      newItems[index] = {
        ...newItems[index],
        [name]: numValue,
        amount: name === 'quantity'
          ? numValue * newItems[index].rate
          : newItems[index].quantity * numValue
      };
    } else {
      newItems[index] = { ...newItems[index], [name]: value };
    }

    setOrderItems(newItems);

    if (errors.items[index] && errors.items[index][name]) {
      const newItemErrors = [...errors.items];
      newItemErrors[index] = { ...newItemErrors[index], [name]: '' };
      setErrors(prev => ({
        ...prev,
        items: newItemErrors
      }));
    }
  };

  const addItem = () => {
    setOrderItems([...orderItems, { item: '', category: '', quantity: 0, rate: 0, amount: 0 }]);
    setAvailableCategories([...availableCategories, []]);
    setErrors(prev => ({
      ...prev,
      items: [...prev.items, {}]
    }));
  };

  const removeItem = (index: number) => {
    if (orderItems.length === 1) {
      // Don't remove the last item, just reset it
      setOrderItems([{ item: '', category: '', quantity: 0, rate: 0, amount: 0 }]);
      setAvailableCategories([[]]);
      setErrors(prev => ({
        ...prev,
        items: [{}]
      }));
      return;
    }

    const newItems = orderItems.filter((_, i) => i !== index);
    const newCategories = availableCategories.filter((_, i) => i !== index);
    const newItemErrors = errors.items.filter((_, i) => i !== index);

    setOrderItems(newItems);
    setAvailableCategories(newCategories);
    setErrors(prev => ({
      ...prev,
      items: newItemErrors
    }));
  };

  const validateForm = () => {
    const newCustomerErrors: Record<string, string> = {};
    const newItemErrors: Record<string, string>[] = orderItems.map(() => ({}));
    let isValid = true;

    // Validate customer info
    if (!customerInfo.customerName.trim()) {
      newCustomerErrors.customerName = 'Customer name is required';
      isValid = false;
    }

    if (!customerInfo.customerPhone.trim()) {
      newCustomerErrors.customerPhone = 'Customer phone is required';
      isValid = false;
    }

    if (customerInfo.paid < 0) {
      newCustomerErrors.paid = 'Paid amount cannot be negative';
      isValid = false;
    }

    // Validate each item
    orderItems.forEach((item, index) => {
      if (!item.item) {
        newItemErrors[index].item = 'Item is required';
        isValid = false;
      }

      if (!item.category) {
        newItemErrors[index].category = 'Category is required';
        isValid = false;
      }

      if (item.quantity <= 0) {
        newItemErrors[index].quantity = 'Quantity must be greater than 0';
        isValid = false;
      }

      if (item.rate <= 0) {
        newItemErrors[index].rate = 'Rate must be greater than 0';
        isValid = false;
      }

      // Check inventory availability
      if (item.item && item.category) {
        const inventoryItem = inventory.find(
          inv => inv.item === item.item && inv.category === item.category
        );

        if (!inventoryItem) {
          newItemErrors[index].item = 'Item not found in inventory';
          isValid = false;
        } else if (inventoryItem.quantity < item.quantity) {
          // For simplicity, we're not handling the case of editing an existing order here
          // In a real app, you'd need to account for the original quantity
          newItemErrors[index].quantity = `Only ${inventoryItem.quantity} units available`;
          isValid = false;
        }
      }
    });

    setErrors({
      customer: newCustomerErrors,
      items: newItemErrors
    });

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // If there's only one item, use the legacy format
      if (orderItems.length === 1) {
        const item = orderItems[0];
        onSave({
          customerId: customerInfo.customerId || Date.now().toString(),
          customerName: customerInfo.customerName,
          customerPhone: customerInfo.customerPhone,
          item: item.item,
          category: item.category,
          quantity: item.quantity,
          rate: item.rate,
          totalAmount: item.amount,
          paid: customerInfo.paid,
          due: due,
          status: customerInfo.status,
          deliveryDate: customerInfo.deliveryDate,
          items: orderItems
        });
      } else {
        // Use the new format with multiple items
        // For the main order fields, use the first item's data
        const firstItem = orderItems[0];
        onSave({
          customerId: customerInfo.customerId || Date.now().toString(),
          customerName: customerInfo.customerName,
          customerPhone: customerInfo.customerPhone,
          item: firstItem.item,
          category: firstItem.category,
          quantity: firstItem.quantity,
          rate: firstItem.rate,
          totalAmount: totalAmount,
          paid: customerInfo.paid,
          due: due,
          status: customerInfo.status,
          deliveryDate: customerInfo.deliveryDate,
          items: orderItems
        });
      }
    }
  };

  const uniqueItems = [...new Set(inventory.map(inv => inv.item))];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-cream rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-elegant">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-display font-bold gradient-text-warm">
            {order ? 'Edit Order' : 'Add New Order'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-elegant"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <div className="bg-white/50 rounded-2xl p-6 border border-amber-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={customerInfo.customerName}
                  onChange={handleCustomerInfoChange}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                  placeholder="Enter customer name"
                />
                {errors.customer.customerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={customerInfo.customerPhone}
                  onChange={handleCustomerInfoChange}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                  placeholder="Enter phone number"
                />
                {errors.customer.customerPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer.customerPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={customerInfo.status}
                  onChange={handleCustomerInfoChange}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={customerInfo.deliveryDate}
                  onChange={handleCustomerInfoChange}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white/50 rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {orderItems.map((item, index) => (
              <div key={index} className="mb-6 p-4 bg-white rounded-xl border border-amber-100 relative">
                {orderItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    title="Remove Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Item
                    </label>
                    <select
                      name="item"
                      value={item.item}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                    >
                      <option value="">Select item</option>
                      {uniqueItems.map(itemName => (
                        <option key={itemName} value={itemName}>{itemName}</option>
                      ))}
                    </select>
                    {errors.items[index]?.item && (
                      <p className="text-red-500 text-sm mt-1">{errors.items[index].item}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={item.category}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!item.item}
                    >
                      <option value="">Select category</option>
                      {availableCategories[index]?.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.items[index]?.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.items[index].category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, e)}
                      min="1"
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                    />
                    {errors.items[index]?.quantity && (
                      <p className="text-red-500 text-sm mt-1">{errors.items[index].quantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="rate"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, e)}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                    />
                    {errors.items[index]?.rate && (
                      <p className="text-red-500 text-sm mt-1">{errors.items[index].rate}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-right">
                  <span className="text-sm font-semibold text-gray-700">
                    Amount: ₹{item.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Information */}
          <div className="bg-white/50 rounded-2xl p-6 border border-amber-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  readOnly
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl bg-amber-50/50 text-gray-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paid Amount (₹)
                </label>
                <input
                  type="number"
                  name="paid"
                  value={customerInfo.paid}
                  onChange={handleCustomerInfoChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                />
                {errors.customer.paid && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer.paid}</p>
                )}
                {customerInfo.paid > totalAmount && (
                  <p className="text-blue-600 text-sm mt-1 font-medium">
                    Excess payment: ₹{(customerInfo.paid - totalAmount).toLocaleString('en-IN')} will be added as credit balance
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Amount (₹)
                </label>
                <input
                  type="number"
                  value={due}
                  readOnly
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl bg-amber-50/50 text-gray-700 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-8 border-t border-amber-200/50">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white/80 border border-gray-300 rounded-xl hover:bg-gray-50 transition-elegant"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl transition-elegant shadow-warm"
            >
              {order ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;