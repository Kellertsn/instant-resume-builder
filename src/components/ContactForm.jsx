export default function ContactForm() {
  return (
    <section className="bg-gray-100 py-20 text-center">
      <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
      <form className="max-w-md mx-auto space-y-4">
        <input type="text" placeholder="Name" className="w-full p-3 border rounded" />
        <input type="email" placeholder="Email" className="w-full p-3 border rounded" />
        <textarea placeholder="Message" className="w-full p-3 border rounded h-32"></textarea>
        <button type="submit" className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full">Send Message</button>
      </form>
    </section>
  );
}
