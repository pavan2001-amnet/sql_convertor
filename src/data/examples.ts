export interface Example {
  title: string;
  snippet: string;
  full: string;
}

export const sqlExamples: Example[] = [
  {
    title: "Basic SELECT Procedure",
    snippet: `CREATE PROCEDURE dbo.GetEmployeeById
@EmployeeId INT
AS
BEGIN
    SELECT * FROM Employees WHERE EmployeeId = @EmployeeId
END`,
    full: `CREATE PROCEDURE dbo.GetEmployeeById
@EmployeeId INT
AS
BEGIN
    SELECT * FROM Employees WHERE EmployeeId = @EmployeeId
END`
  },
  {
    title: "INSERT Procedure",
    snippet: `CREATE PROCEDURE dbo.InsertProduct
@Name NVARCHAR(100),
@Price DECIMAL(10, 2),
@CategoryId INT,
@ProductId INT OUTPUT
AS
BEGIN
    INSERT INTO Products (Name, Price, CategoryId)
    VALUES (@Name, @Price, @CategoryId);
    
    SET @ProductId = SCOPE_IDENTITY();
END`,
    full: `CREATE PROCEDURE dbo.InsertProduct
@Name NVARCHAR(100),
@Price DECIMAL(10, 2),
@CategoryId INT,
@ProductId INT OUTPUT
AS
BEGIN
    INSERT INTO Products (Name, Price, CategoryId)
    VALUES (@Name, @Price, @CategoryId);
    
    SET @ProductId = SCOPE_IDENTITY();
END`
  },
  {
    title: "UPDATE with Transaction",
    snippet: `CREATE PROCEDURE dbo.UpdateOrderStatus
@OrderId INT,
@Status NVARCHAR(50)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
            UPDATE Orders
            SET Status = @Status,
                UpdatedDate = GETDATE()
            WHERE OrderId = @OrderId
        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        -- Error handling
    END CATCH
END`,
    full: `CREATE PROCEDURE dbo.UpdateOrderStatus
@OrderId INT,
@Status NVARCHAR(50)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
            UPDATE Orders
            SET Status = @Status,
                UpdatedDate = GETDATE()
            WHERE OrderId = @OrderId
        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        -- Error handling
    END CATCH
END`
  }
];

export const postgresExamples: Example[] = [
  {
    title: "Basic SELECT Function",
    snippet: `CREATE OR REPLACE FUNCTION get_employee_by_id(
    employee_id INTEGER
)
RETURNS TABLE (
    employee_id INTEGER,
    first_name TEXT,
    last_name TEXT,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.employee_id, e.first_name, e.last_name, e.email
    FROM employees e
    WHERE e.employee_id = get_employee_by_id.employee_id;
END;
$$ LANGUAGE plpgsql;`,
    full: `CREATE OR REPLACE FUNCTION get_employee_by_id(
    employee_id INTEGER
)
RETURNS TABLE (
    employee_id INTEGER,
    first_name TEXT,
    last_name TEXT,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.employee_id, e.first_name, e.last_name, e.email
    FROM employees e
    WHERE e.employee_id = get_employee_by_id.employee_id;
END;
$$ LANGUAGE plpgsql;`
  },
  {
    title: "INSERT Function with RETURNING",
    snippet: `CREATE OR REPLACE FUNCTION insert_product(
    p_name TEXT,
    p_price DECIMAL(10,2),
    p_category_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_product_id INTEGER;
BEGIN
    INSERT INTO products (name, price, category_id)
    VALUES (p_name, p_price, p_category_id)
    RETURNING product_id INTO v_product_id;
    
    RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;`,
    full: `CREATE OR REPLACE FUNCTION insert_product(
    p_name TEXT,
    p_price DECIMAL(10,2),
    p_category_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_product_id INTEGER;
BEGIN
    INSERT INTO products (name, price, category_id)
    VALUES (p_name, p_price, p_category_id)
    RETURNING product_id INTO v_product_id;
    
    RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;`
  },
  {
    title: "UPDATE with Transaction",
    snippet: `CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id INTEGER,
    p_status TEXT
)
RETURNS VOID AS $$
BEGIN
    BEGIN
        UPDATE orders
        SET status = p_status,
            updated_date = CURRENT_TIMESTAMP
        WHERE order_id = p_order_id;
        
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;`,
    full: `CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id INTEGER,
    p_status TEXT
)
RETURNS VOID AS $$
BEGIN
    BEGIN
        UPDATE orders
        SET status = p_status,
            updated_date = CURRENT_TIMESTAMP
        WHERE order_id = p_order_id;
        
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;`
  }
];

export const mysqlExamples: Example[] = [
  {
    title: "Basic SELECT Procedure",
    snippet: `DELIMITER $$

CREATE PROCEDURE GetEmployeeById(
    IN p_employee_id INT
)
BEGIN
    SELECT * FROM Employees WHERE EmployeeId = p_employee_id;
END$$

DELIMITER ;`,
    full: `DELIMITER $$

CREATE PROCEDURE GetEmployeeById(
    IN p_employee_id INT
)
BEGIN
    SELECT * FROM Employees WHERE EmployeeId = p_employee_id;
END$$

DELIMITER ;`
  },
  {
    title: "INSERT Procedure with LAST_INSERT_ID",
    snippet: `DELIMITER $$

CREATE PROCEDURE InsertProduct(
    IN p_name VARCHAR(100),
    IN p_price DECIMAL(10, 2),
    IN p_category_id INT,
    OUT p_product_id INT
)
BEGIN
    INSERT INTO Products (Name, Price, CategoryId)
    VALUES (p_name, p_price, p_category_id);
    
    SET p_product_id = LAST_INSERT_ID();
END$$

DELIMITER ;`,
    full: `DELIMITER $$

CREATE PROCEDURE InsertProduct(
    IN p_name VARCHAR(100),
    IN p_price DECIMAL(10, 2),
    IN p_category_id INT,
    OUT p_product_id INT
)
BEGIN
    INSERT INTO Products (Name, Price, CategoryId)
    VALUES (p_name, p_price, p_category_id);
    
    SET p_product_id = LAST_INSERT_ID();
END$$

DELIMITER ;`
  },
  {
    title: "UPDATE with Transaction",
    snippet: `DELIMITER $$

CREATE PROCEDURE UpdateOrderStatus(
    IN p_order_id INT,
    IN p_status VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
        UPDATE Orders
        SET Status = p_status,
            UpdatedDate = NOW()
        WHERE OrderId = p_order_id;
    COMMIT;
END$$

DELIMITER ;`,
    full: `DELIMITER $$

CREATE PROCEDURE UpdateOrderStatus(
    IN p_order_id INT,
    IN p_status VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
        UPDATE Orders
        SET Status = p_status,
            UpdatedDate = NOW()
        WHERE OrderId = p_order_id;
    COMMIT;
END$$

DELIMITER ;`
  }
];

export const getExamplesByType = (type: 'sqlserver' | 'postgresql' | 'mysql'): Example[] => {
  switch (type) {
    case 'sqlserver':
      return sqlExamples;
    case 'postgresql':
      return postgresExamples;
    case 'mysql':
      return mysqlExamples;
    default:
      return sqlExamples;
  }
};