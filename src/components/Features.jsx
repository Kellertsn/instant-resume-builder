import React from 'react';

export default function Features() {
  return (
    <section className="py-20 bg-gray-50 text-center">
      <h2 className="text-3xl font-bold mb-8 text-googleBlueDark">Features</h2>
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <div className="text-5xl mb-4 text-googleBlue">🚀</div>
          <h3 className="font-semibold mb-2">Fast Performance</h3>
          <p>Instant load times with optimized bundling.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <div className="text-5xl mb-4 text-googleRed">📱</div>
          <h3 className="font-semibold mb-2">Responsive Design</h3>
          <p>Looks great on all devices.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <div className="text-5xl mb-4 text-googleYellow">⚙️</div>
          <h3 className="font-semibold mb-2">Highly Customizable</h3>
          <p>Easily tweak styles to fit your brand.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <div className="text-5xl mb-4 text-googleGreen">🔒</div>
          <h3 className="font-semibold mb-2">Secure</h3>
          <p>Built with best security practices.</p>
        </div>
      </div>
    </section>
  );
}
