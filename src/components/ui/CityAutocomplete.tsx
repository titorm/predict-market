'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { MapPin, CaretDown, Check, X, WarningCircle } from '@phosphor-icons/react';
import {
  SANTA_CATARINA_CITIES,
  isSantaCatarinaCity,
  filterSantaCatarinaCities,
  findCanonicalSantaCatarinaCity,
} from '@/data/santa-catarina-cities';

export interface CityAutocompleteProps {
  label?: string;
  value: string;
  onChange: (city: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  id?: string;
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder = 'Selecione ou digite sua cidade em SC...',
  required = false,
  disabled = false,
  onBlur,
  id,
}) => {
  const generatedId = useId();
  const inputId = id || `city-autocomplete-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setSearchTerm(value);
    });
  }, [value]);

  const filteredCities = filterSantaCatarinaCities(searchTerm);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen) {
          const canonical = findCanonicalSantaCatarinaCity(searchTerm);
          if (canonical) {
            onChange(canonical);
            setSearchTerm(canonical);
          } else if (!isSantaCatarinaCity(value)) {
            onChange('');
            setSearchTerm('');
          } else {
            setSearchTerm(value);
          }
          setIsOpen(false);
          onBlur?.();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchTerm, value, onChange, onBlur]);

  const handleSelectCity = (city: string) => {
    onChange(city);
    setSearchTerm(city);
    setIsOpen(false);
    onBlur?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchTerm(text);
    setHighlightedIndex(0);

    if (!isOpen) {
      setIsOpen(true);
    }

    const canonical = findCanonicalSantaCatarinaCity(text);
    if (canonical) {
      onChange(canonical);
    } else if (value && value !== text) {
      onChange('');
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (document.activeElement && containerRef.current?.contains(document.activeElement)) {
        return;
      }
      const canonical = findCanonicalSantaCatarinaCity(searchTerm);
      if (canonical) {
        onChange(canonical);
        setSearchTerm(canonical);
      } else if (!isSantaCatarinaCity(searchTerm)) {
        if (isSantaCatarinaCity(value)) {
          setSearchTerm(value);
        } else {
          onChange('');
          setSearchTerm('');
        }
      }
      setIsOpen(false);
      onBlur?.();
    }, 150);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredCities.length ? prev + 1 : 0));
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredCities.length - 1));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredCities.length > 0) {
        const targetCity = filteredCities[highlightedIndex] ?? filteredCities[0];
        if (targetCity) {
          handleSelectCity(targetCity);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm(value);
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      const item = items[index];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const isSelectedValid = isSantaCatarinaCity(value);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={inputId}
            className="block text-[12px] font-bold text-ink tracking-tight"
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
          <span className="text-[11px] text-muted font-normal">
            Santa Catarina (SC)
          </span>
        </div>
      )}

      <div
        className={`relative flex items-center w-full h-[56px] px-3.5 bg-canvas border rounded-sm transition-colors ${
          error
            ? 'border-error bg-error/[0.02] ring-1 ring-error'
            : isOpen
            ? 'border-2 border-ink'
            : 'border-hairline hover:border-muted'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <MapPin
          size={18}
          weight="bold"
          className={`shrink-0 mr-2.5 transition-colors ${
            isSelectedValid ? 'text-primary' : 'text-muted'
          }`}
        />

        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${inputId}-listbox`}
          aria-autocomplete="list"
          aria-invalid={!!error}
          aria-describedby={errorId || hintId}
          className="w-full h-full bg-transparent text-[16px] text-ink placeholder:text-muted-soft focus:outline-none"
        />

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar cidade"
              className="p-1 rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors"
            >
              <X size={14} weight="bold" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-muted hover:text-ink transition-colors"
            aria-label="Alternar lista de cidades"
          >
            <CaretDown
              size={16}
              weight="bold"
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          id={`${inputId}-listbox`}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-canvas border border-hairline rounded-sm shadow-airbnb overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3.5 py-2 bg-surface-soft border-b border-hairline/60 flex items-center justify-between text-[11px] font-medium text-muted">
            <span>
              {filteredCities.length === SANTA_CATARINA_CITIES.length
                ? 'Todos os 295 municípios de SC'
                : `${filteredCities.length} de 295 municípios`}
            </span>
            <span className="text-primary font-semibold">SC</span>
          </div>

          <ul
            ref={listRef}
            className="max-h-[220px] overflow-y-auto divide-y divide-hairline/30 py-1"
          >
            {filteredCities.length === 0 ? (
              <li className="px-4 py-6 text-center text-[13px] text-muted">
                Nenhuma cidade de Santa Catarina encontrada com &ldquo;{searchTerm}&rdquo;.
              </li>
            ) : (
              filteredCities.map((city, index) => {
                const isSelected = city === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={city}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCity(city)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3.5 py-2.5 flex items-center justify-between text-[14px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : isHighlighted
                        ? 'bg-surface-soft text-ink'
                        : 'text-ink hover:bg-surface-soft'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={15}
                        weight={isSelected ? 'fill' : 'regular'}
                        className={isSelected ? 'text-primary' : 'text-muted'}
                      />
                      <span>{city}</span>
                    </div>

                    {isSelected && (
                      <Check size={16} weight="bold" className="text-primary shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {hint && !error && (
        <p id={hintId} className="text-[12px] text-muted mt-1.5 font-normal">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[12px] text-error mt-1.5 font-medium flex items-center gap-1.5 animate-in fade-in duration-150"
        >
          <WarningCircle size={15} weight="bold" className="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
