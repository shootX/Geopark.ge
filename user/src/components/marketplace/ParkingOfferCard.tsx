'use client';

import { useState } from 'react';
import type { ParkingOffer } from '@/types';

interface ParkingOfferCardProps {
  offer: ParkingOffer;
  onBook?: (offerId: number) => void;
  onEdit?: (offer: ParkingOffer) => void;
  onToggle?: (offer: ParkingOffer) => void;
  showActions?: boolean;
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  booked: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активно',
  paused: 'Приостановлено',
  booked: 'Забронировано',
  completed: 'Завершено',
  blocked: 'Заблокировано',
};

export default function ParkingOfferCard({
  offer,
  onBook,
  onEdit,
  onToggle,
  showActions = false,
  compact = false,
}: ParkingOfferCardProps) {
  const [imageError, setImageError] = useState(false);

  const mainImage =
    !imageError && offer.images && offer.images.length > 0
      ? offer.images[0]?.url
      : null;

  const statusClass = statusColors[offer.status] || 'bg-gray-100 text-gray-700';
  const statusLabel = statusLabels[offer.status] || offer.status_label || offer.status;

  const priceDisplay = offer.hourly_price
    ? `₾${Number(offer.hourly_price).toFixed(2)} / час`
    : 'Цена не указана';

  const isActive = offer.is_active && offer.status === 'active';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-40 bg-gray-200">
        {mainImage ? (
          <img
            src={mainImage}
            alt={offer.title || 'Parking offer'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {offer.title || 'Parking Offer'}
            </h3>
            {offer.parking?.address && (
              <p className="text-sm text-gray-500 truncate mt-0.5">{offer.parking.address}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-blue-600 whitespace-nowrap">{priceDisplay}</p>
          </div>
        </div>

        {/* Details row */}
        {!compact && (
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            {offer.parking_type && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {offer.parking_type === 'private' ? 'Частная' : 'Муниципальная'}
              </span>
            )}
            {offer.minimum_hours && (
              <span>Мин. {offer.minimum_hours} ч</span>
            )}
            {offer.supported_vehicle_sizes?.length > 0 && (
              <span className="capitalize">
                {offer.supported_vehicle_sizes.join(', ')}
              </span>
            )}
            {offer.average_rating > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {offer.average_rating.toFixed(1)}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {isActive && onBook && (
              <button
                onClick={() => onBook(offer.id)}
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Забронировать
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(offer)}
                className="p-1.5 text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Редактировать"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onToggle && (
              <button
                onClick={() => onToggle(offer)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  isActive
                    ? 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'
                    : 'text-green-600 border-green-200 hover:bg-green-50'
                }`}
              >
                {isActive ? 'Пауза' : 'Активировать'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
