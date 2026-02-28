export default function ContactForm() {
  return (
    <section className="bg-gray-100 py-20 text-center">
      <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
      <form className="max-w-md mx-auto space-y-4" onSubmit={e => e.preventDefault()}>
        <input type="text" placeholder="Name" className="w-full p-3 border rounded" />
        <input type="email" placeholder="Email" className="w-full p-3 border rounded" />
        <textarea placeholder="Message" className="w-full p-3 border rounded h-32"></textarea>
        <button type="submit" disabled className="mt-4 px-6 py-3 bg-gray-400 text-white rounded-full cursor-not-allowed">Coming Soon</button>
      </form>
    </section>
  );
}
