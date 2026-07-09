import React from 'react';

const Modal = ({ title, content, onSave, onClose, saveLabel = 'Salvar' }) => {
  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" id="modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6" id="modal-content">{content}</div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancelar</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white btn-primary rounded-lg">{saveLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;