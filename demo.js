const inputfile = document.getElementById('fileInput');
inputfile.addEventListener('change', function(event) {
    const file = event.target.files[0];
    console.log('File selected:', file);
    const reader = new FileReader();
     reader.onload = function(e) {
        const data = e.target.result;
        console.log('File data:', data);
        const workbook = XLSX.read(data, { type: 'binary' });
        console.log('Workbook:', workbook);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        console.log('Worksheet:', worksheet);
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('JSON Data:', jsonData);
    };
    reader.readAsBinaryString(file);
});