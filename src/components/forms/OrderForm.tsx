import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Order, Rate, Inventory, User } from '../../types';

interface OrderFormProps {
  user: User;
  order?: Order | null;
  rates: Rate[];
  inventory: Inventory[];
  onSave: (order: Omit<Order, 'id' | 'userId' | 'createdAt'>) => void;
  onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ user, order, rates, inventory, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    item: '',
    category: '',
    quantity: 0,
    rate: 0,
    totalAmount: 0,
    paid: 0,
    due: 0,
    status: 'pending' as 'pending' | 'delivered',
    deliveryDate: new Date().toISOString().split('T')[0],
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (order) {
      setFormData({
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        item: order.item,
        category: order.category,
        quantity: order.quantity,
        rate: order.rate,
        totalAmount: order.totalAmount,
        paid: order.paid,
        due: order.due,
        status: order.status,
        deliveryDate: order.deliveryDate,
      });
    }
  }, [order]);

  useEffect(() => {
    if (formData.item) {
      const categories = inventory
        .filter(inv => inv.item === formData.item)
        .map(inv => inv.category);
      setAvailableCategories(categories);
    } else {
      setAvailableCategories([]);
    }
  }, [formData.item, inventory]);

  useEffect(() => {
    if (formData.item && formData.category) {
      const rateData = rates.find(r => r.item === formData.item && r.category === formData.category);
      if (rateData) {
        setFormData(prev => ({ ...prev, rate: rateData.rate }));
      }
    }
  }, [formData.item, formData.category, rates]);

  useEffect(() => {
    const total = formData.quantity * formData.rate;
    const due = Math.max(0, total - formData.paid); // Due can't be negative
    setFormData(prev => ({
      ...prev,
      totalAmount: total,
      due: due
    }));
  }, [formData.quantity, formData.rate, formData.paid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'rate' || name === 'paid' ? parseFloat(value) || 0 : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Customer phone is required';
    if (!formData.item) newErrors.item = 'Item is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (formData.rate <= 0) newErrors.rate = 'Rate must be greater than 0';
    if (formData.paid < 0) newErrors.paid = 'Paid amount cannot be negative';

    // Check inventory availability
    const inventoryItem = inventory.find(
      inv => inv.item === formData.item && inv.category === formData.category
    );

    if (!inventoryItem) {
      newErrors.item = 'Item not found in inventory';
    } else if (!order && inventoryItem.quantity < formData.quantity) {
      newErrors.quantity = `Only ${inventoryItem.quantity} units available`;
    } else if (order && inventoryItem.quantity + order.quantity < formData.quantity) {
      newErrors.quantity = `Only ${inventoryItem.quantity + order.quantity} units available`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        customerId: formData.customerId || Date.now().toString(),
      });
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                placeholder="Enter customer name"
              />
              {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Phone
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
                placeholder="Enter phone number"
              />
              {errors.customerPhone && <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Item
              </label>
              <select
                name="item"
                value={formData.item}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
              >
                <option value="">Select item</option>
                {uniqueItems.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.item && <p className="text-red-500 text-sm mt-1">{errors.item}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!formData.item}
              >
                <option value="">Select category</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rate (₹)
              </label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
              />
              {errors.rate && <p className="text-red-500 text-sm mt-1">{errors.rate}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Total Amount (₹)
              </label>
              <input
                type="number"
                value={formData.totalAmount}
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
                value={formData.paid}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
              />
              {errors.paid && <p className="text-red-500 text-sm mt-1">{errors.paid}</p>}
              {formData.paid > formData.totalAmount && (
                <p className="text-blue-600 text-sm mt-1 font-medium">
                  Excess payment: ₹{(formData.paid - formData.totalAmount).toLocaleString('en-IN')} will be added as credit balance
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Amount (₹)
              </label>
              <input
                type="number"
                value={formData.due}
                readOnly
                className="w-full px-4 py-3 border border-amber-200 rounded-xl bg-amber-50/50 text-gray-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
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
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
              />
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