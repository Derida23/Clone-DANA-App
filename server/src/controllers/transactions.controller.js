const Transactions = require('../models/Transactions');
const Users = require('../models/Users');
const Services = require('../models/Services');
const Vouchers = require('../models/Vouchers');

// Get transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transactions.findAll();
    res.json({
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      message: 'Something goes wrong',
      data: {}
    });
  }
}

// Transaction parrent
exports.createTransactions = async (req, res) => {
  const {
    id_services
  } = req.body;

  const service = await Services.findOne({
    where: {
      id: id_services
    }
  });
  if (service.dataValues.type === "BALANCE") {
    this.createTransactionsTransfer(req, res)
  } else if (service.dataValues.type === "TOPUP") {
    this.createTransactionsTopUp(req, res)
  } else if (service.dataValues.type === "PPOB") {
    this.createTransactionsPPOB(req, res)
  }
}

// Create transactions transfer
exports.createTransactionsTransfer = async (req, res) => {
  const status = 'success';
  const {
    invoice,
    customer,
    id_user,
    amount,
    id_services,
    id_vouchers,
    description,
    payment_method
  } = req.body;

  try {
    //check and handle null
    if (customer === "" || customer === null) {
      return res.json({
        status: "error",
        message: "Customer must be filled!"
      });
    }

    if (amount === "" || amount === null || amount < 10000) {
      return res.json({
        status: "error",
        message: "Amount minimum is Rp.10000!"
      });
    }

    if (status === "" || status === null) {
      return res.json({
        status: "error",
        message: "Status must be filled!"
      });
    }

    // Get id current user
    const currentUser = await Users.findOne({
      where: {
        id: id_user
      }
    })
    // Get number customer on user
    const customerData = await Users.findOne({
      where: {
        phone: customer
      }
    })

    //Check balance current user
    if (currentUser.dataValues.balance < amount) {
      return res.json({
        message: 'Insufficient Balance'
      })
    } else {
      const balanceCurrent = currentUser.dataValues.balance - amount;
      const balanceCustomer = customerData.dataValues.balance + amount;

      //Insert Transaction to database
      let newTransactions = await Transactions.create({
        invoice,
        customer,
        id_user,
        amount,
        id_services,
        id_vouchers,
        status,
        description,
        payment_method
      }, {
        fields: ['invoice', 'customer', 'id_user', 'amount', 'id_services', 'id_vouchers', 'status', 'description', 'payment_method']
      });
      if (newTransactions) {
        //Update Current Users
        await Users.update({
          balance: balanceCurrent
        }, {
          where: {
            id: id_user
          }
        });

        //Update Current Users
        await Users.update({
          balance: balanceCustomer
        }, {
          where: {
            phone: customer
          }
        });

        return res.json({
          message: 'Transactions was created succesfully',
          data: newTransactions
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      message: 'Something goes wrong',
      data: {}
    });
  }
};

// Create transaction TopUp
exports.createTransactionsTopUp = async (req, res) => {
  const status = 'pending';
  const {
    invoice,
    customer,
    id_user,
    amount,
    id_services,
    id_vouchers,
    description,
    payment_method
  } = req.body;

  // try {
  //check and handle null
  if (amount === "" || amount === null || amount < 10000) {
    return res.json({
      status: "error",
      message: "Amount minimum is Rp.10000!"
    });
  }

  if (status === "" || status === null) {
    return res.json({
      status: "error",
      message: "Status must be filled!"
    });
  }

  // Get id current user
  const currentUser = await Users.findOne({
    where: {
      id: id_user
    }
  })

  //Check balance current user
  const balanceCurrent = currentUser.dataValues.balance + amount;

  //Insert Transaction to database
  let newTransactions = await Transactions.create({
    invoice,
    customer,
    id_user,
    amount,
    id_services,
    id_vouchers,
    status,
    description,
    payment_method
  }, {
    fields: ['invoice', 'customer', 'id_user', 'amount', 'id_services', 'id_vouchers', 'status', 'description', 'payment_method']
  });
  if (newTransactions) {
    //Update Current Users
    await Users.update({
      balance: balanceCurrent
    }, {
      where: {
        id: id_user
      }
    });

    //Update Current Users
    await Users.update({
      balance: balanceCurrent
    }, {
      where: {
        id: id_user
      }
    });

    return res.json({
      message: 'Transactions was created succesfully',
      data: newTransactions
    });
  }
  // } catch (error) {
  res.status(500).json({
    message: 'Something goes wrong',
    data: {}
  });
  // }
};

// Create transaction PPOB
exports.createTransactionsPPOB = async (req, res) => {
  const status = 'success';
  let currentAmount = '';
  const {
    invoice,
    customer,
    id_user,
    id_services,
    id_vouchers,
    description,
    payment_method
  } = req.body;
  let {amount} = req.body;

  // try {
  //check and handle null
  if (status === "" || status === null) {
    return res.json({
      status: "error",
      message: "Status must be filled!"
    });
  }

  // Get id current user
  const currentUser = await Users.findOne({
    where: {
      id: id_user
    }
  })

  // get vouchers
  const voucher = await Vouchers.findOne({
    where: {
      id: id_vouchers
    }
  })

  if (voucher) {
    currentAmount = amount - voucher.dataValues.amount;
    amount = currentAmount;
  } else {
    currentAmount = amount;
  }

  if (currentUser.dataValues.balance <= currentAmount) {
    return res.json({
      message: "Insufficient balance"
    })
  }
  //Check balance current user
  const balanceCurrent = currentUser.dataValues.balance - currentAmount;

  //Insert Transaction to database
  let newTransactions = await Transactions.create({
    invoice,
    customer,
    id_user,
    amount,
    id_services,
    id_vouchers,
    status,
    description,
    payment_method
  }, {
    fields: ['invoice', 'customer', 'id_user', 'amount', 'id_services', 'id_vouchers', 'status', 'description', 'payment_method']
  });
  if (newTransactions) {
    //Update Current Users
    await Users.update({
      balance: balanceCurrent
    }, {
      where: {
        id: id_user
      }
    });

    //Update Current Users
    await Users.update({
      balance: balanceCurrent
    }, {
      where: {
        id: id_user
      }
    });

    return res.json({
      message: 'Transactions was created succesfully',
      data: newTransactions
    });
  }
  // } catch (error) {
  res.status(500).json({
    message: 'Something goes wrong',
    data: {}
  });
  // }
};

// Get one transactions
exports.getOneTransactions = async (req, res) => {
  const {
    id
  } = req.params;
  const transactions = await Transactions.findOne({
    where: {
      id
    }
  });
  if (transactions) {
    res.json({
      data: transactions
    });
  } else {
    res.json({
      message: "Transactions id not found"
    });
  }
}

// Delete transactions
exports.deleteTransactions = async (req, res) => {
  const {
    id
  } = req.params;
  const deleteRowCount = await Transactions.destroy({
    where: {
      id
    }
  });
  if (deleteRowCount) {
    res.json({
      message: 'Transaction deleted succesully',
      count: deleteRowCount
    });
  } else {
    res.json({
      message: "Transactions id not found"
    });
  }
}